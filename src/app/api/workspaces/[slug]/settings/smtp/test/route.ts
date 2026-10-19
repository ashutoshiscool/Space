import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceMember } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import {
  getSmtpConfig,
  saveSmtpConfig,
  sendSmtpEmail,
  buildTestEmailHtml,
} from "@/lib/smtp";
import { z } from "zod";

const testEmailSchema = z.object({
  recipient: z.string().email("Please provide a valid recipient email address"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { workspace } = await requireWorkspaceMember(slug, [
      WorkspaceRole.OWNER,
      WorkspaceRole.ADMIN,
    ]);

    const body = await req.json();
    const parsed = testEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid recipient" },
        { status: 400 }
      );
    }

    const config = await getSmtpConfig(slug);

    if (!config.host || !config.fromEmail) {
      return NextResponse.json(
        {
          error: "Incomplete SMTP configuration. Please configure and save Host and Sender Email first.",
        },
        { status: 400 }
      );
    }

    const htmlContent = buildTestEmailHtml({
      recipient: parsed.data.recipient,
      workspaceName: workspace.name,
      config,
    });

    const result = await sendSmtpEmail({
      to: parsed.data.recipient,
      subject: `[${workspace.name}] Space SMTP Verification Test`,
      html: htmlContent,
      config,
    });

    // Update test status in config
    await saveSmtpConfig(slug, {
      lastTestedAt: new Date().toISOString(),
      lastTestStatus: result.success ? "SUCCESS" : "FAILED",
      lastTestError: result.error || null,
      lastTestRecipient: parsed.data.recipient,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          latencyMs: result.latencyMs,
          transcript: result.transcript,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      latencyMs: result.latencyMs,
      transcript: result.transcript,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to execute SMTP test" },
      { status: err.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
