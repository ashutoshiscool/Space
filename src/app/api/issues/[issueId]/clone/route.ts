import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { WorkspaceRole, RelationType } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { user, issue: original, project } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json().catch(() => ({}));
    const cloneTitle = body.title?.trim() || `[Clone] ${original.title}`;

    const newIssue = await prisma.$transaction(async (tx) => {
      // Find highest sequenceId in project with concurrency lock
      const lastIssue = await tx.issue.findFirst({
        where: { projectId: original.projectId },
        orderBy: { sequenceId: "desc" },
        select: { sequenceId: true },
      });

      const nextSequenceId = (lastIssue?.sequenceId || 0) + 1;

      // Create cloned issue
      const clone = await tx.issue.create({
        data: {
          projectId: original.projectId,
          sequenceId: nextSequenceId,
          type: original.type,
          title: cloneTitle,
          description: original.description,
          priority: original.priority,
          stateId: original.stateId,
          estimate: original.estimate,
          timeEstimate: original.timeEstimate,
          cycleId: original.cycleId,
          moduleId: original.moduleId,
          componentId: original.componentId,
          createdById: user.id,
        },
        include: {
          state: true,
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          labels: { include: { label: true } },
          cycle: true,
          module: true,
          component: true,
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });

      // Link clone to original issue
      await tx.issueRelation.create({
        data: {
          sourceId: clone.id,
          targetId: original.id,
          type: RelationType.RELATED,
        },
      });

      // Activity log
      await tx.issueActivity.create({
        data: {
          issueId: clone.id,
          userId: user.id,
          action: "CLONED_FROM",
          field: "clonedFrom",
          newValue: `${project.identifier}-${original.sequenceId}`,
        },
      });

      return clone;
    });

    return NextResponse.json({ issue: newIssue }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to clone issue" }, { status: 500 });
  }
}
