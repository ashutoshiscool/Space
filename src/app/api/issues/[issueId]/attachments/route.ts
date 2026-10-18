import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const createAttachmentSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileUrl: z.string().min(1, "File URL is required"),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().default("application/octet-stream"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    await requireIssueAccess(issueId, ["OWNER", "ADMIN", "MEMBER", "GUEST"]);

    const attachments = await prisma.issueAttachment.findMany({
      where: { issueId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ attachments });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "ISSUE_NOT_FOUND") {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN_ISSUE_ACCESS" || message === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch attachments" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { user } = await requireIssueAccess(issueId, ["OWNER", "ADMIN", "MEMBER"]);
    const body = await req.json();
    const data = createAttachmentSchema.parse(body);

    const attachment = await prisma.$transaction(async (tx) => {
      const att = await tx.issueAttachment.create({
        data: {
          issueId,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
        },
      });

      await tx.issueActivity.create({
        data: {
          issueId,
          userId: user.id,
          action: "ATTACHMENT_ADDED",
          field: "attachment",
          newValue: data.fileName,
        },
      });

      return att;
    });

    return NextResponse.json({ attachment });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "ISSUE_NOT_FOUND") {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN_ISSUE_ACCESS" || message === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create attachment" }, { status: 500 });
  }
}
