import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { IssuePriority, IssueType, WorkspaceRole, Prisma } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";
import {
  dispatchEventNotification,
  extractMentionedUserIds,
} from "@/lib/event-notifications";

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  type: z.nativeEnum(IssueType).optional(),
  stateId: z.string().optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  estimate: z.number().int().nullable().optional(),
  timeEstimate: z.number().int().nullable().optional(),
  timeSpent: z.number().int().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
  moduleId: z.string().nullable().optional(),
  componentId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  isArchived: z.boolean().optional(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    // Enforce tenant authorization
    await requireIssueAccess(issueId);

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
            workspaceId: true,
            states: { orderBy: { sequence: "asc" } },
            labels: true,
            components: true,
            cycles: { where: { isCompleted: false } },
            modules: true,
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
        state: true,
        component: true,
        assignees: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        labels: {
          include: {
            label: true,
          },
        },
        cycle: true,
        module: true,
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        watchers: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
        worklogs: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { loggedAt: "desc" },
        },
        parent: {
          select: { id: true, sequenceId: true, title: true },
        },
        subIssues: {
          include: {
            state: true,
            assignees: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              },
            },
          },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        relations: {
          include: {
            target: {
              select: {
                id: true,
                sequenceId: true,
                title: true,
                priority: true,
                state: true,
              },
            },
          },
        },
        relatedBy: {
          include: {
            source: {
              select: {
                id: true,
                sequenceId: true,
                title: true,
                priority: true,
                state: true,
              },
            },
          },
        },
      },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    return NextResponse.json({ issue });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No access to this issue" }, { status: 403 });
    }
    if (msg === "ISSUE_NOT_FOUND") {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    // Enforce tenant authorization and role (Guests cannot edit issues)
    const { user, issue: current, project, workspace } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const data = updateIssueSchema.parse(body);

    const fullCurrent = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { state: true, assignees: true },
    });

    if (!fullCurrent) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Process updates and generate activity audit entries
    const updated: any = await prisma.$transaction(async (tx: any) => {
      // Check for state change
      if (data.stateId && data.stateId !== fullCurrent.stateId) {
        const newState = await tx.state.findUnique({ where: { id: data.stateId } });
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "STATE_CHANGED",
            field: "state",
            oldValue: fullCurrent.state.name,
            newValue: newState?.name ?? data.stateId,
          },
        });
      }

      // Check for priority change
      if (data.priority && data.priority !== fullCurrent.priority) {
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "PRIORITY_CHANGED",
            field: "priority",
            oldValue: fullCurrent.priority,
            newValue: data.priority,
          },
        });
      }

      // Check for estimate change
      if (data.estimate !== undefined && data.estimate !== fullCurrent.estimate) {
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "ESTIMATE_CHANGED",
            field: "estimate",
            oldValue: fullCurrent.estimate ? `${fullCurrent.estimate} pts` : "none",
            newValue: data.estimate ? `${data.estimate} pts` : "none",
          },
        });
      }

      // Handle assignees update if provided
      if (data.assigneeIds !== undefined) {
        await tx.issueAssignee.deleteMany({ where: { issueId } });
        if (data.assigneeIds.length > 0) {
          await tx.issueAssignee.createMany({
            data: data.assigneeIds.map((userId) => ({ issueId, userId })),
          });
        }
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "ASSIGNED",
            field: "assignees",
            newValue: `${data.assigneeIds.length} assignees`,
          },
        });
      }

      // Handle labels update if provided
      if (data.labelIds !== undefined) {
        await tx.issueLabel.deleteMany({ where: { issueId } });
        if (data.labelIds.length > 0) {
          await tx.issueLabel.createMany({
            data: data.labelIds.map((labelId) => ({ issueId, labelId })),
          });
        }
      }

      const issueUpdateData: Prisma.IssueUpdateInput = {};
      if (data.title !== undefined) issueUpdateData.title = data.title;
      if (data.description !== undefined) issueUpdateData.description = data.description;
      if (data.type !== undefined) issueUpdateData.type = data.type;
      if (data.stateId !== undefined) issueUpdateData.state = { connect: { id: data.stateId } };
      if (data.priority !== undefined) issueUpdateData.priority = data.priority;
      if (data.estimate !== undefined) issueUpdateData.estimate = data.estimate;
      if (data.timeEstimate !== undefined) issueUpdateData.timeEstimate = data.timeEstimate;
      if (data.timeSpent !== undefined) issueUpdateData.timeSpent = data.timeSpent;
      if (data.startDate !== undefined)
        issueUpdateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.dueDate !== undefined)
        issueUpdateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.cycleId !== undefined)
        issueUpdateData.cycle = data.cycleId ? { connect: { id: data.cycleId } } : { disconnect: true };
      if (data.moduleId !== undefined)
        issueUpdateData.module = data.moduleId ? { connect: { id: data.moduleId } } : { disconnect: true };
      if (data.componentId !== undefined)
        issueUpdateData.component = data.componentId ? { connect: { id: data.componentId } } : { disconnect: true };
      if (data.parentId !== undefined)
        issueUpdateData.parent = data.parentId ? { connect: { id: data.parentId } } : { disconnect: true };
      if (data.isArchived !== undefined) issueUpdateData.isArchived = data.isArchived;

      return tx.issue.update({
        where: { id: issueId },
        data: issueUpdateData,
        include: {
          state: true,
          component: true,
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          labels: {
            include: { label: true },
          },
          watchers: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          worklogs: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
            orderBy: { loggedAt: "desc" },
          },
          cycle: true,
          module: true,
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });
    });

    // 1. Status transition notification
    if (data.stateId && data.stateId !== fullCurrent.stateId) {
      dispatchEventNotification({
        type: "ISSUE_STATUS_CHANGED",
        workspaceSlug: workspace?.slug || project.workspaceId,
        projectId: project.id,
        projectIdentifier: project.identifier,
        projectName: project.name,
        issueId: updated.id,
        sequenceId: updated.sequenceId,
        issueTitle: updated.title,
        actor: { id: user.id, name: user.name, email: user.email },
        details: {
          oldState: fullCurrent.state.name,
          newState: (updated as any)?.state?.name || "Updated",
        },
      }).catch((e) => console.error("[Notifications] Status change error:", e));
    }

    // 2. Priority change notification
    if (data.priority && data.priority !== fullCurrent.priority) {
      dispatchEventNotification({
        type: "ISSUE_PRIORITY_CHANGED",
        workspaceSlug: workspace?.slug || project.workspaceId,
        projectId: project.id,
        projectIdentifier: project.identifier,
        projectName: project.name,
        issueId: updated.id,
        sequenceId: updated.sequenceId,
        issueTitle: updated.title,
        actor: { id: user.id, name: user.name, email: user.email },
        details: {
          oldPriority: fullCurrent.priority,
          newPriority: updated.priority,
        },
      }).catch((e) => console.error("[Notifications] Priority change error:", e));
    }

    // 3. Due date change notification
    if (
      data.dueDate !== undefined &&
      String(data.dueDate) !== String(fullCurrent.dueDate)
    ) {
      dispatchEventNotification({
        type: "ISSUE_DUE_DATE_CHANGED",
        workspaceSlug: workspace?.slug || project.workspaceId,
        projectId: project.id,
        projectIdentifier: project.identifier,
        projectName: project.name,
        issueId: updated.id,
        sequenceId: updated.sequenceId,
        issueTitle: updated.title,
        actor: { id: user.id, name: user.name, email: user.email },
        details: {
          dueDate: data.dueDate,
        },
      }).catch((e) => console.error("[Notifications] Due date change error:", e));
    }

    // 4. Assignees change notification (newly assigned users)
    if (data.assigneeIds !== undefined) {
      const currentIds = fullCurrent.assignees.map((a) => a.userId);
      const newlyAssigned = data.assigneeIds.filter(
        (id) => !currentIds.includes(id)
      );
      if (newlyAssigned.length > 0) {
        dispatchEventNotification({
          type: "ISSUE_ASSIGNED",
          workspaceSlug: workspace?.slug || project.workspaceId,
          projectId: project.id,
          projectIdentifier: project.identifier,
          projectName: project.name,
          issueId: updated.id,
          sequenceId: updated.sequenceId,
          issueTitle: updated.title,
          actor: { id: user.id, name: user.name, email: user.email },
          details: {
            assignedUserIds: newlyAssigned,
          },
        }).catch((e) =>
          console.error("[Notifications] Assignees change error:", e)
        );
      }
    }

    // 5. Description mentions notification
    if (data.description && data.description !== fullCurrent.description) {
      extractMentionedUserIds(data.description, project.id).then(
        (mentioned) => {
          if (mentioned.length > 0) {
            dispatchEventNotification({
              type: "USER_MENTIONED",
              workspaceSlug: workspace?.slug || project.workspaceId,
              projectId: project.id,
              projectIdentifier: project.identifier,
              projectName: project.name,
              issueId: updated.id,
              sequenceId: updated.sequenceId,
              issueTitle: updated.title,
              actor: { id: user.id, name: user.name, email: user.email },
              details: {
                mentionedUserIds: mentioned,
                commentContent: data.description || "",
              },
            }).catch((e) => console.error("[Notifications] Mentions error:", e));
          }
        }
      );
    }

    return NextResponse.json({ issue: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No permission to update this issue" }, { status: 403 });
    }
    if (msg === "ISSUE_NOT_FOUND") {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    // Enforce tenant authorization and role (Guests cannot archive/delete issues)
    const { user, issue: current, project, workspace } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { isArchived: true },
    });

    dispatchEventNotification({
      type: "ISSUE_DELETED",
      workspaceSlug: workspace?.slug || project.workspaceId,
      projectId: project.id,
      projectIdentifier: project.identifier,
      projectName: project.name,
      issueId: issue.id,
      sequenceId: issue.sequenceId,
      issueTitle: issue.title,
      actor: { id: user.id, name: user.name, email: user.email },
    }).catch((e) => console.error("[Notifications] Delete error:", e));

    return NextResponse.json({ success: true, issue });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to archive issue" }, { status: 500 });
  }
}
