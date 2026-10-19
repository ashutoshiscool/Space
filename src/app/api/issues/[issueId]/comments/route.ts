import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";
import {
  dispatchEventNotification,
  extractMentionedUserIds,
} from "@/lib/event-notifications";

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
    const { user, issue, project, workspace } = await requireIssueAccess(issueId, [
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
        createdBy: true,
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

    // Extract user mentions in comment
    const mentionedUserIds = await extractMentionedUserIds(
      content,
      fullIssue.projectId
    );

    // Dispatch Space comment event notification (email + in-app)
    dispatchEventNotification({
      type: "ISSUE_COMMENT_ADDED",
      workspaceSlug: workspace?.slug || fullIssue.project.workspaceId,
      projectId: fullIssue.projectId,
      projectIdentifier: fullIssue.project.identifier,
      projectName: fullIssue.project.name,
      issueId: fullIssue.id,
      sequenceId: fullIssue.sequenceId,
      issueTitle: fullIssue.title,
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details: {
        commentContent: content,
        mentionedUserIds,
      },
    }).catch((err) =>
      console.error("[Notifications] Comment dispatch error:", err)
    );

    // If users were directly @mentioned, dispatch USER_MENTIONED notification
    if (mentionedUserIds.length > 0) {
      dispatchEventNotification({
        type: "USER_MENTIONED",
        workspaceSlug: workspace?.slug || fullIssue.project.workspaceId,
        projectId: fullIssue.projectId,
        projectIdentifier: fullIssue.project.identifier,
        projectName: fullIssue.project.name,
        issueId: fullIssue.id,
        sequenceId: fullIssue.sequenceId,
        issueTitle: fullIssue.title,
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        details: {
          commentContent: content,
          mentionedUserIds,
        },
      }).catch((err) =>
        console.error("[Notifications] Mention dispatch error:", err)
      );
    }

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
