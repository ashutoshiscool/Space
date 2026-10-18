import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const commentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty").max(5000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    // Enforce tenant authorization and role (Members, Admins, Owners only)
    const { user, issue } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const { content } = commentSchema.parse(body);

    const fullIssue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        assignees: true,
      },
    });

    if (!fullIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const comment = await prisma.$transaction(async (tx) => {
      const c = await tx.issueComment.create({
        data: {
          issueId,
          userId: user.id,
          content,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      await tx.issueActivity.create({
        data: {
          issueId,
          userId: user.id,
          action: "COMMENT_ADDED",
          newValue: content.substring(0, 100),
        },
      });

      // Notify assignees (except the comment author)
      for (const a of fullIssue.assignees) {
        if (a.userId !== user.id) {
          await tx.notification.create({
            data: {
              userId: a.userId,
              title: `New comment on ${fullIssue.project.identifier}-${fullIssue.sequenceId}`,
              message: `${user.name} commented: "${content.substring(0, 60)}..."`,
              link: `/${fullIssue.project.workspaceId}/${fullIssue.project.identifier}/issues`,
            },
          });
        }
      }

      return c;
    });

    return NextResponse.json({ comment });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No permission to comment on this issue" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
