import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const user = await requireAuth();
    const { issueId } = await params;
    const body = await req.json();
    const { content } = commentSchema.parse(body);

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        assignees: true,
      },
    });

    if (!issue) {
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
      for (const a of issue.assignees) {
        if (a.userId !== user.id) {
          await tx.notification.create({
            data: {
              userId: a.userId,
              title: `New comment on ${issue.project.identifier}-${issue.sequenceId}`,
              message: `${user.name} commented: "${content.substring(0, 60)}..."`,
              link: `/${issue.project.workspaceId}/${issue.project.identifier}/issues`,
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
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
