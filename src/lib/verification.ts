import fs from "fs";
import path from "path";
import { SignJWT, jwtVerify } from "jose";
import { getSmtpConfig, sendSmtpEmail, SmtpConfig, DEFAULT_SMTP_CONFIG } from "./smtp";
import { prisma } from "./prisma";

const DATA_DIR = path.join(process.cwd(), "data");
const VERIFICATIONS_FILE = path.join(DATA_DIR, "email-verifications.json");
const SMTP_CONFIGS_FILE = path.join(DATA_DIR, "smtp-configs.json");

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "space_super_secret_jwt_key_987654321_space_app"
);

export interface VerificationRecord {
  userId: string;
  email: string;
  token: string;
  code: string;
  verified: boolean;
  createdAt: string;
  expiresAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadVerifications(): Record<string, VerificationRecord> {
  ensureDataDir();
  if (!fs.existsSync(VERIFICATIONS_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(VERIFICATIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveVerifications(records: Record<string, VerificationRecord>) {
  ensureDataDir();
  fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(records, null, 2), "utf-8");
}

/**
 * Resolves the active SMTP configuration across workspaces or environment variables.
 */
export async function getSystemSmtpConfig(): Promise<SmtpConfig | null> {
  if (!fs.existsSync(SMTP_CONFIGS_FILE)) {
    if (process.env.RESEND_API_KEY) {
      return {
        ...DEFAULT_SMTP_CONFIG,
        host: "smtp.resend.com",
        password: process.env.RESEND_API_KEY,
        fromEmail: process.env.SMTP_FROM || "onboarding@resend.dev",
        isEnabled: true,
      };
    }
    return null;
  }

  try {
    const raw = fs.readFileSync(SMTP_CONFIGS_FILE, "utf-8");
    const configs: Record<string, SmtpConfig> = JSON.parse(raw);
    const list = Object.values(configs);

    // 1. Any explicitly enabled config with password
    const enabled = list.find(
      (c) => c.isEnabled && Boolean(c.password && c.password.trim().length > 0)
    );
    if (enabled) return enabled;

    // 2. Any config with a valid non-empty password & fromEmail
    const configured = list.find(
      (c) => Boolean(c.password && c.password.trim().length > 0 && c.fromEmail)
    );
    if (configured) return configured;

    if (process.env.RESEND_API_KEY) {
      return {
        ...DEFAULT_SMTP_CONFIG,
        host: "smtp.resend.com",
        password: process.env.RESEND_API_KEY,
        fromEmail: process.env.SMTP_FROM || "onboarding@resend.dev",
        isEnabled: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a live SMTP relay or API gateway is configured and ready.
 */
export async function isSmtpSetUp(): Promise<boolean> {
  const cfg = await getSystemSmtpConfig();
  return Boolean(cfg && cfg.password && cfg.password.trim().length > 0);
}

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signVerificationToken(payload: { userId: string; email: string }): Promise<string> {
  return new SignJWT({ ...payload, purpose: "email_verification" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function createVerification(userId: string, email: string) {
  const code = generateVerificationCode();
  const token = await signVerificationToken({ userId, email });
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const records = loadVerifications();
  const record: VerificationRecord = {
    userId,
    email: email.toLowerCase(),
    token,
    code,
    verified: false,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  records[email.toLowerCase()] = record;
  records[userId] = record;
  saveVerifications(records);

  return { token, code, expiresAt };
}

export async function isUserEmailVerified(userId: string, email: string): Promise<boolean> {
  const records = loadVerifications();
  const record = records[email.toLowerCase()] || records[userId];
  // If no record exists for this user (e.g. existing accounts or created when SMTP was not active),
  // they are considered verified by default.
  if (!record) {
    return true;
  }
  return record.verified;
}

export async function verifyTokenOrCode(input: string, optionalEmail?: string) {
  const cleaned = input.trim();
  const records = loadVerifications();

  // 1. If 6-digit numeric code
  if (/^\d{6}$/.test(cleaned)) {
    let match: VerificationRecord | undefined;
    if (optionalEmail) {
      const r = records[optionalEmail.toLowerCase()];
      if (r && r.code === cleaned) match = r;
    }
    if (!match) {
      match = Object.values(records).find((r) => r.code === cleaned && !r.verified);
    }

    if (!match) {
      return { success: false, error: "Invalid or expired 6-digit verification code" };
    }

    if (new Date(match.expiresAt).getTime() < Date.now()) {
      return { success: false, error: "Verification code has expired. Please request a new one." };
    }

    match.verified = true;
    records[match.email.toLowerCase()] = match;
    records[match.userId] = match;
    saveVerifications(records);

    return { success: true, userId: match.userId, email: match.email };
  }

  // 2. If JWT token
  try {
    const { payload } = await jwtVerify(cleaned, SECRET);
    if (payload.purpose !== "email_verification") {
      return { success: false, error: "Invalid verification token" };
    }

    const userId = payload.userId as string;
    const email = payload.email as string;

    const record = records[email?.toLowerCase()] || records[userId];
    if (record) {
      record.verified = true;
      records[record.email.toLowerCase()] = record;
      records[record.userId] = record;
      saveVerifications(records);
    }

    return { success: true, userId, email };
  } catch {
    return { success: false, error: "Invalid or expired verification link" };
  }
}

/**
 * Builds and dispatches the HTML verification email to a newly signed up user.
 */
export async function sendUserVerificationEmail({
  userId,
  email,
  name,
  origin,
}: {
  userId: string;
  email: string;
  name: string;
  origin?: string;
}) {
  const config = await getSystemSmtpConfig();
  if (!config || !config.password) {
    return { sent: false, reason: "NOT_CONFIGURED" as const };
  }

  const { token, code } = await createVerification(userId, email);
  const baseUrl = origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 32px 16px; color: #111827;">
  <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #f1f3f5;">
      <div style="background-color: #3e63dd; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 32px; color: #ffffff; font-weight: bold; font-size: 16px;">
        S
      </div>
      <span style="font-size: 16px; font-weight: 700; color: #111827;">Space</span>
    </div>

    <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">Verify your email address</h2>
    <p style="font-size: 13px; color: #4b5563; line-height: 1.5; margin: 0 0 24px 0;">
      Hi ${name}, welcome to Space! Please confirm your email address to activate your account and access your workspaces.
    </p>

    <!-- Call to action button -->
    <div style="margin-bottom: 28px; text-align: center;">
      <a href="${verifyUrl}" style="display: inline-block; background-color: #3e63dd; color: #ffffff; font-size: 13px; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 1px 2px rgba(62, 99, 221, 0.2);">
        Verify Email Address &rarr;
      </a>
    </div>

    <!-- 6-digit code box -->
    <div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
      <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px;">
        Or enter this 6-digit verification code:
      </div>
      <div style="font-family: monospace; font-size: 24px; font-weight: 700; letter-spacing: 4px; color: #111827;">
        ${code}
      </div>
    </div>

    <p style="font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0 0 16px 0;">
      If the button above does not work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #3e63dd; word-break: break-all; font-size: 11px;">${verifyUrl}</a>
    </p>

    <div style="padding-top: 16px; border-top: 1px solid #f1f3f5; font-size: 11px; color: #9ca3af;">
      This verification link will expire in 24 hours. If you did not create an account with Space, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`;

  const result = await sendSmtpEmail({
    to: email,
    subject: "Verify your email address — Space",
    html,
    config,
  });

  return {
    sent: result.success,
    token,
    code,
    error: result.error,
    message: result.message,
  };
}
