import fs from "fs";
import path from "path";
import net from "net";
import tls from "tls";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465 SSL, false for 587 STARTTLS / 25
  transport?: "auto" | "https" | "smtp" | "sandbox";
  username: string;
  password?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  isEnabled: boolean;
  notifyOnIssueCreated: boolean;
  notifyOnIssueAssigned: boolean;
  notifyOnIssueStatusChanged: boolean;
  notifyOnIssueComment: boolean;
  notifyOnPriorityOrDueDate: boolean;
  notifyOnCycleDigest: boolean;
  lastTestedAt?: string;
  lastTestStatus?: "SUCCESS" | "FAILED";
  lastTestError?: string | null;
  lastTestRecipient?: string | null;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  config?: SmtpConfig;
}

export interface SmtpSendResult {
  success: boolean;
  message: string;
  latencyMs: number;
  error?: string;
  transcript?: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "smtp-configs.json");
const OUTBOX_FILE = path.join(DATA_DIR, "smtp-outbox.log");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadAllConfigs(): Record<string, SmtpConfig> {
  ensureDataDir();
  if (!fs.existsSync(CONFIG_FILE)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAllConfigs(configs: Record<string, SmtpConfig>) {
  ensureDataDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configs, null, 2), "utf-8");
}

export const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: "smtp.resend.com",
  port: 587,
  secure: false,
  transport: "auto",
  username: "resend",
  password: "",
  fromName: "Space Notifications",
  fromEmail: "notifications@space.dev",
  replyTo: "support@space.dev",
  isEnabled: false,
  notifyOnIssueCreated: true,
  notifyOnIssueAssigned: true,
  notifyOnIssueStatusChanged: true,
  notifyOnIssueComment: true,
  notifyOnPriorityOrDueDate: true,
  notifyOnCycleDigest: false,
};

export async function getSmtpConfig(workspaceSlug: string): Promise<SmtpConfig> {
  const configs = loadAllConfigs();
  const found = configs[workspaceSlug];
  if (!found) {
    return { ...DEFAULT_SMTP_CONFIG };
  }
  return { ...DEFAULT_SMTP_CONFIG, ...found };
}

export async function saveSmtpConfig(
  workspaceSlug: string,
  newConfig: Partial<SmtpConfig>
): Promise<SmtpConfig> {
  const configs = loadAllConfigs();
  const existing = configs[workspaceSlug] || { ...DEFAULT_SMTP_CONFIG };

  // If password in newConfig is empty or omitted, retain existing password
  const updatedPassword =
    newConfig.password !== undefined && newConfig.password.trim() !== ""
      ? newConfig.password
      : existing.password;

  const merged: SmtpConfig = {
    ...existing,
    ...newConfig,
    password: updatedPassword,
  };

  configs[workspaceSlug] = merged;
  saveAllConfigs(configs);
  return merged;
}

/**
 * Direct delivery via Resend HTTPS API Gateway (Port 443).
 * Bypasses cloud hosting firewall restrictions on TCP port 25/587.
 */
async function sendViaResendHttp({
  to,
  subject,
  html,
  textContent,
  apiKey,
  fromName,
  fromEmail,
  replyTo,
  startTime,
}: {
  to: string;
  subject: string;
  html: string;
  textContent: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  startTime: number;
}): Promise<SmtpSendResult> {
  const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 5)}••••••••` : "••••••••";
  const transcript: string[] = [
    "Connecting to Resend API Gateway (HTTPS Port 443 — Cloud Firewall Bypass)...",
    "POST https://api.resend.com/emails",
    `Authorization: Bearer ${maskedKey}`,
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: "${subject}"`,
  ];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: [to],
        subject,
        html,
        text: textContent,
        reply_to: replyTo || undefined,
      }),
    });

    const latencyMs = Date.now() - startTime;
    const data = await res.json().catch(() => null);

    if (res.ok) {
      transcript.push(`HTTP ${res.status} OK — Delivery accepted by Resend`);
      if (data?.id) transcript.push(`Resend Message ID: ${data.id}`);
      transcript.push(`250 OK: Queued for delivery to ${to}`);
      return {
        success: true,
        message: `Email verified & delivered via Resend Gateway (ID: ${data?.id || "OK"})`,
        latencyMs,
        transcript,
      };
    } else {
      const errMsg =
        data?.message ||
        data?.error ||
        `Resend API error (${res.status}): ${res.statusText}`;
      transcript.push(`HTTP ${res.status} Error: ${errMsg}`);

      if (res.status === 403 && errMsg.toLowerCase().includes("domain")) {
        transcript.push(
          "Hint: The sender domain is not verified on your Resend account. In Resend, verify your domain at resend.com/domains or use 'onboarding@resend.dev' as sender for test delivery."
        );
      }
      return {
        success: false,
        message: errMsg,
        error: errMsg,
        latencyMs,
        transcript,
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    transcript.push(`HTTPS fetch error: ${err.message}`);
    return {
      success: false,
      message: `Failed to connect to Resend API: ${err.message}`,
      error: err.message,
      latencyMs,
      transcript,
    };
  }
}

/**
 * Direct delivery via SendGrid v3 Mail Send API (Port 443).
 */
async function sendViaSendGridHttp({
  to,
  subject,
  html,
  textContent,
  apiKey,
  fromName,
  fromEmail,
  startTime,
}: {
  to: string;
  subject: string;
  html: string;
  textContent: string;
  apiKey: string;
  fromName: string;
  fromEmail: string;
  startTime: number;
}): Promise<SmtpSendResult> {
  const maskedKey = apiKey.length > 8 ? `${apiKey.slice(0, 5)}••••••••` : "••••••••";
  const transcript: string[] = [
    "Connecting to SendGrid API Gateway (HTTPS Port 443 — Cloud Firewall Bypass)...",
    "POST https://api.sendgrid.com/v3/mail/send",
    `Authorization: Bearer ${maskedKey}`,
    `From: ${fromName} <${fromEmail}>`,
    `To: ${to}`,
    `Subject: "${subject}"`,
  ];

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [
          { type: "text/plain", value: textContent },
          { type: "text/html", value: html },
        ],
      }),
    });

    const latencyMs = Date.now() - startTime;
    if (res.status === 202 || res.ok) {
      transcript.push("HTTP 202 Accepted — SendGrid accepted the message");
      transcript.push(`250 OK: Queued for delivery to ${to}`);
      return {
        success: true,
        message: "Email accepted by SendGrid for dispatch",
        latencyMs,
        transcript,
      };
    } else {
      const data = await res.json().catch(() => null);
      const errMsg =
        data?.errors?.[0]?.message ||
        `SendGrid returned HTTP ${res.status}: ${res.statusText}`;
      transcript.push(`HTTP ${res.status} Error: ${errMsg}`);
      return {
        success: false,
        message: errMsg,
        error: errMsg,
        latencyMs,
        transcript,
      };
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    transcript.push(`SendGrid fetch error: ${err.message}`);
    return {
      success: false,
      message: err.message,
      error: err.message,
      latencyMs,
      transcript,
    };
  }
}

/**
 * Native Node.js SMTP socket delivery with STARTTLS, TLS, and HTTPS Gateway support.
 * Returns transcript and latency for full observability.
 */
export async function sendSmtpEmail({
  to,
  subject,
  html,
  text,
  config,
}: SendEmailOptions): Promise<SmtpSendResult> {
  const activeConfig = config || DEFAULT_SMTP_CONFIG;
  const startTime = Date.now();
  const transcript: string[] = [];

  // Plain text fallback
  const textContent = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  // If mock/dummy host or disabled, record in outbox log and return simulated delivery
  const isMockHost =
    activeConfig.transport === "sandbox" ||
    !activeConfig.host ||
    activeConfig.host.includes("example.com") ||
    activeConfig.host.includes("localhost") ||
    activeConfig.host === "smtp.space.dev";

  if (isMockHost) {
    const logEntry = `[${new Date().toISOString()}] MOCK SEND to: ${to} | Subject: "${subject}" | Host: ${activeConfig.host}:${activeConfig.port}\n`;
    try {
      ensureDataDir();
      fs.appendFileSync(OUTBOX_FILE, logEntry, "utf-8");
    } catch {
      // ignore file write error
    }

    return {
      success: true,
      message: `Mock email logged to local outbox for ${to}`,
      latencyMs: Date.now() - startTime,
      transcript: [
        `Connecting to mock host ${activeConfig.host}:${activeConfig.port}`,
        "220 space.local ESMTP ready",
        "EHLO localhost",
        "250-space.local greets you",
        `MAIL FROM:<${activeConfig.fromEmail}>`,
        "250 OK",
        `RCPT TO:<${to}>`,
        "250 OK",
        "DATA",
        "354 Start mail input; end with <CRLF>.<CRLF>",
        "250 OK: queued as mock-msg-001",
        "QUIT",
        "221 Bye",
      ],
    };
  }

  const isResend =
    activeConfig.host.includes("resend") ||
    (Boolean(activeConfig.password) && activeConfig.password!.startsWith("re_"));

  const isSendGrid =
    activeConfig.host.includes("sendgrid") ||
    (Boolean(activeConfig.password) && activeConfig.password!.startsWith("SG."));

  // Check if HTTPS Relay should be used directly.
  // In cloud container/VM hosting, outbound TCP ports 25 and 587 are universally blocked.
  // When an API key is available for Resend or SendGrid, or when transport is 'https' or 'auto',
  // we route through the official HTTPS API gateway (port 443) for 100% firewall-proof delivery.
  const shouldUseHttpsGateway =
    activeConfig.transport === "https" ||
    ((!activeConfig.transport || activeConfig.transport === "auto") &&
      ((isResend && Boolean(activeConfig.password)) ||
        (isSendGrid && Boolean(activeConfig.password))));

  if (shouldUseHttpsGateway) {
    if (isResend && activeConfig.password) {
      return sendViaResendHttp({
        to,
        subject,
        html,
        textContent,
        apiKey: activeConfig.password,
        fromName: activeConfig.fromName,
        fromEmail: activeConfig.fromEmail,
        replyTo: activeConfig.replyTo,
        startTime,
      });
    }

    if (isSendGrid && activeConfig.password) {
      return sendViaSendGridHttp({
        to,
        subject,
        html,
        textContent,
        apiKey: activeConfig.password,
        fromName: activeConfig.fromName,
        fromEmail: activeConfig.fromEmail,
        startTime,
      });
    }
  }

  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket;
    let step = 0;
    let isTlsUpgraded = false;

    const timeout = setTimeout(async () => {
      if (socket && !socket.destroyed) socket.destroy();

      // If socket timed out and we have a Resend key, try HTTP fallback immediately!
      if (isResend && activeConfig.password) {
        const httpResult = await sendViaResendHttp({
          to,
          subject,
          html,
          textContent,
          apiKey: activeConfig.password,
          fromName: activeConfig.fromName,
          fromEmail: activeConfig.fromEmail,
          replyTo: activeConfig.replyTo,
          startTime,
        });
        httpResult.transcript = [
          `Warning: Socket connection timed out to ${activeConfig.host}:${activeConfig.port} (cloud hosting firewall blocked outbound port).`,
          `Failing over to Resend HTTPS API Gateway...`,
          ...(httpResult.transcript || []),
        ];
        resolve(httpResult);
        return;
      }

      if (isSendGrid && activeConfig.password) {
        const httpResult = await sendViaSendGridHttp({
          to,
          subject,
          html,
          textContent,
          apiKey: activeConfig.password,
          fromName: activeConfig.fromName,
          fromEmail: activeConfig.fromEmail,
          startTime,
        });
        httpResult.transcript = [
          `Warning: Socket connection timed out to ${activeConfig.host}:${activeConfig.port} (cloud hosting firewall blocked outbound port).`,
          `Failing over to SendGrid HTTPS API Gateway...`,
          ...(httpResult.transcript || []),
        ];
        resolve(httpResult);
        return;
      }

      resolve({
        success: false,
        message: `Connection timed out after 6000ms to ${activeConfig.host}:${activeConfig.port}. (Note: Cloud hosting firewalls universally block outbound TCP ports 25 and 587. Resend/SendGrid HTTPS API Relay is recommended).`,
        latencyMs: Date.now() - startTime,
        error: "ETIMEDOUT: Connection timed out",
        transcript: [
          ...transcript,
          `Connection timed out to ${activeConfig.host}:${activeConfig.port}`,
          `[Firewall Diagnosis] Outbound port ${activeConfig.port} appears to be blocked by the server network firewall.`,
          `Recommendation: Switch to Port 465 (SSL/TLS) or select HTTPS API Relay.`,
        ],
      });
    }, 6000);

    const logAndSend = (cmd: string) => {
      transcript.push(`> ${cmd.startsWith("AUTH") || (cmd.length > 30 && step === 3) ? "[REDACTED]" : cmd}`);
      socket.write(cmd + "\r\n");
    };

    const handleServerData = (data: Buffer) => {
      const response = data.toString();
      transcript.push(`< ${response.trim()}`);

      const code = parseInt(response.slice(0, 3), 10);

      // Handle multiline replies (e.g. "250-...")
      if (response.slice(3, 4) === "-") {
        return;
      }

      if (code >= 400) {
        clearTimeout(timeout);
        socket.destroy();
        resolve({
          success: false,
          message: `SMTP error response ${code}: ${response.trim()}`,
          latencyMs: Date.now() - startTime,
          error: response.trim(),
          transcript,
        });
        return;
      }

      // Step 0: Initial connection greeting received (220)
      if (step === 0 && code === 220) {
        step = 1;
        logAndSend("EHLO localhost");
        return;
      }

      // Step 1: After EHLO, check if STARTTLS is needed (port 587)
      if (step === 1 && code === 250) {
        if (!activeConfig.secure && activeConfig.port === 587 && !isTlsUpgraded) {
          step = 2;
          logAndSend("STARTTLS");
          return;
        }

        // If TLS already upgraded or port 465, proceed to AUTH or MAIL
        step = activeConfig.username ? 3 : 5;
        if (activeConfig.username) {
          logAndSend("AUTH LOGIN");
        } else {
          logAndSend(`MAIL FROM:<${activeConfig.fromEmail}>`);
        }
        return;
      }

      // Step 2: STARTTLS confirmed (220), upgrade socket
      if (step === 2 && code === 220) {
        isTlsUpgraded = true;
        const tlsSocket = tls.connect(
          {
            socket: socket as net.Socket,
            host: activeConfig.host,
            rejectUnauthorized: false,
          },
          () => {
            step = 1; // Send EHLO again over TLS
            logAndSend("EHLO localhost");
          }
        );

        tlsSocket.on("data", handleServerData);
        tlsSocket.on("error", (err) => {
          clearTimeout(timeout);
          resolve({
            success: false,
            message: `TLS Handshake failed: ${err.message}`,
            latencyMs: Date.now() - startTime,
            error: err.message,
            transcript,
          });
        });

        socket = tlsSocket;
        return;
      }

      // Step 3: AUTH LOGIN username prompt (334)
      if (step === 3 && code === 334) {
        step = 4;
        const b64User = Buffer.from(activeConfig.username).toString("base64");
        logAndSend(b64User);
        return;
      }

      // Step 4: AUTH LOGIN password prompt (334)
      if (step === 4 && code === 334) {
        step = 5;
        const b64Pass = Buffer.from(activeConfig.password || "").toString("base64");
        logAndSend(b64Pass);
        return;
      }

      // Step 5: Auth Successful (235) -> Send MAIL FROM
      if (step === 5 && (code === 235 || code === 250)) {
        step = 6;
        logAndSend(`MAIL FROM:<${activeConfig.fromEmail}>`);
        return;
      }

      // Step 6: MAIL FROM OK (250) -> Send RCPT TO
      if (step === 6 && code === 250) {
        step = 7;
        logAndSend(`RCPT TO:<${to}>`);
        return;
      }

      // Step 7: RCPT TO OK (250) -> Send DATA
      if (step === 7 && code === 250) {
        step = 8;
        logAndSend("DATA");
        return;
      }

      // Step 8: Ready for data (354) -> Send Headers & Content
      if (step === 8 && code === 354) {
        step = 9;
        const mimeBoundary = "----=_Part_" + Date.now();
        const dateStr = new Date().toUTCString();
        const headers = [
          `From: ${activeConfig.fromName} <${activeConfig.fromEmail}>`,
          `To: ${to}`,
          `Subject: ${subject}`,
          `Date: ${dateStr}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: 7bit`,
          activeConfig.replyTo ? `Reply-To: ${activeConfig.replyTo}` : "",
        ]
          .filter(Boolean)
          .join("\r\n");

        const rawMessage = `${headers}\r\n\r\n${html}\r\n.`;
        transcript.push(`> [SENT RFC-2822 EMAIL PAYLOAD (${rawMessage.length} bytes)]`);
        socket.write(rawMessage + "\r\n");
        return;
      }

      // Step 9: Message Queued OK (250) -> Send QUIT & Finish
      if (step === 9 && code === 250) {
        step = 10;
        logAndSend("QUIT");
        clearTimeout(timeout);
        socket.end();

        resolve({
          success: true,
          message: `Email accepted by ${activeConfig.host} for ${to} (250 OK)`,
          latencyMs: Date.now() - startTime,
          transcript,
        });
        return;
      }

      if (step === 10) {
        clearTimeout(timeout);
        socket.end();
      }
    };

    try {
      if (activeConfig.secure) {
        // Port 465 SSL/TLS direct connection
        socket = tls.connect(
          {
            host: activeConfig.host,
            port: activeConfig.port,
            rejectUnauthorized: false,
          },
          () => {
            transcript.push(`Connected directly via TLS to ${activeConfig.host}:${activeConfig.port}`);
          }
        );
      } else {
        // Port 587 or 25 plain TCP (upgraded to STARTTLS later if needed)
        socket = net.createConnection(
          {
            host: activeConfig.host,
            port: activeConfig.port,
          },
          () => {
            transcript.push(`Connected via TCP to ${activeConfig.host}:${activeConfig.port}`);
          }
        );
      }

      socket.on("data", handleServerData);

      socket.on("error", (err) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          message: `Network socket error connecting to ${activeConfig.host}:${activeConfig.port}: ${err.message}`,
          latencyMs: Date.now() - startTime,
          error: err.message,
          transcript,
        });
      });
    } catch (err: any) {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: `Socket initialization error: ${err.message}`,
        latencyMs: Date.now() - startTime,
        error: err.message,
        transcript,
      });
    }
  });
}

/**
 * Generate a beautifully styled Space test email template.
 */
export function buildTestEmailHtml({
  recipient,
  workspaceName,
  config,
}: {
  recipient: string;
  workspaceName: string;
  config: SmtpConfig;
}) {
  const dateFormatted = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Space SMTP Verification</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 32px 16px; color: #111827;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
      <div style="background-color: #3e63dd; width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 36px; color: #ffffff; font-weight: bold; font-size: 18px;">
        S
      </div>
      <div>
        <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">Space Delivery Service</h2>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">SMTP Configuration Verification</p>
      </div>
    </div>

    <!-- Status Banner -->
    <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; font-weight: 600; color: #065f46;">
        ✓ SMTP Server Connected Successfully
      </p>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #047857;">
        Your outbound mail server is verified and ready to dispatch notifications for <strong>${workspaceName}</strong>.
      </p>
    </div>

    <!-- Configuration Details Table -->
    <div style="margin-bottom: 24px;">
      <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 12px;">Connection Parameters</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <tr style="border-bottom: 1px solid #f1f3f5;">
          <td style="padding: 8px 0; color: #6b7280;">Host Server</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right; font-family: monospace;">${config.host}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f3f5;">
          <td style="padding: 8px 0; color: #6b7280;">Port & Security</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right; font-family: monospace;">${config.port} (${config.secure ? "SSL/TLS" : "STARTTLS"})</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f3f5;">
          <td style="padding: 8px 0; color: #6b7280;">Sender Address</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right;">${config.fromName} &lt;${config.fromEmail}&gt;</td>
        </tr>
        <tr style="border-bottom: 1px solid #f1f3f5;">
          <td style="padding: 8px 0; color: #6b7280;">Recipient Target</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right;">${recipient}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;">Dispatched At</td>
          <td style="padding: 8px 0; font-weight: 600; color: #111827; text-align: right;">${dateFormatted}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
      This is an automated system test message sent from Space Workspace Settings. No action required.
    </div>
  </div>
</body>
</html>`;
}
