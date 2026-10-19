import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { getSmtpConfig, saveSmtpConfig, SmtpConfig } from "@/lib/smtp";
import { z } from "zod";

const smtpConfigSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  transport: z.enum(["auto", "https", "smtp", "sandbox"]).optional().default("auto"),
  username: z.string().optional().default(""),
  password: z.string().optional(),
  fromName: z.string().min(1, "Sender name is required"),
  fromEmail: z.string().email("Valid sender email is required"),
  replyTo: z.string().email().optional().or(z.literal("")),
  isEnabled: z.boolean(),
  notifyOnIssueCreated: z.boolean().default(true),
  notifyOnIssueAssigned: z.boolean().default(true),
  notifyOnIssueStatusChanged: z.boolean().default(true),
  notifyOnIssueComment: z.boolean().default(true),
  notifyOnPriorityOrDueDate: z.boolean().default(true),
  notifyOnCycleDigest: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireWorkspaceMember(slug, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.MEMBER,
    ]);

    const config = await getSmtpConfig(slug);

    // Return masked password for security
    const sanitizedConfig = {
      ...config,
      password: config.password ? "••••••••" : "",
      hasPassword: Boolean(config.password && config.password.length > 0),
    };

    return NextResponse.json({ config: sanitizedConfig });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve SMTP configuration" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await requireWorkspaceMember(slug, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const body = await req.json();
    const parsed = smtpConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid SMTP configuration" },
        { status: 400 }
      );
    }

    const payload: Partial<SmtpConfig> = {
      ...parsed.data,
      replyTo: parsed.data.replyTo || undefined,
    };

    // If password was sent as masked "••••••••", don't overwrite it
    if (payload.password === "••••••••" || payload.password === "") {
      delete payload.password;
    }

    const saved = await saveSmtpConfig(slug, payload);

    return NextResponse.json({
      success: true,
      config: {
        ...saved,
        password: saved.password ? "••••••••" : "",
        hasPassword: Boolean(saved.password && saved.password.length > 0),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to save SMTP configuration" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
