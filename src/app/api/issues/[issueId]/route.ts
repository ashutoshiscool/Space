import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { IssuePriority } from "@prisma/client";
import { z } from "zod";

const updateIssueSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  stateId: z.string().optional(),
  priority: z.nativeEnum(IssuePriority).optional(),
  estimate: z.number().int().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
  moduleId: z.string().nullable().optional(),
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
    await requireAuth();
    const { issueId } = await params;

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
  } catch (err) {
    console.error("Fetch issue error:", err);
    return NextResponse.json({ error: "Failed to fetch issue" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const user = await requireAuth();
    const { issueId } = await params;
    const body = await req.json();
    const data = updateIssueSchema.parse(body);

    const current = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        state: true,
        assignees: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    // Process updates and generate activity audit entries
    const updated = await prisma.$transaction(async (tx) => {
      // Check for state change
      if (data.stateId && data.stateId !== current.stateId) {
        const newState = await tx.state.findUnique({ where: { id: data.stateId } });
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "STATE_CHANGED",
            field: "state",
            oldValue: current.state.name,
            newValue: newState?.name ?? data.stateId,
          },
        });
      }

      // Check for priority change
      if (data.priority && data.priority !== current.priority) {
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "PRIORITY_CHANGED",
            field: "priority",
            oldValue: current.priority,
            newValue: data.priority,
          },
        });
      }

      // Check for estimate change
      if (data.estimate !== undefined && data.estimate !== current.estimate) {
        await tx.issueActivity.create({
          data: {
            issueId,
            userId: user.id,
            action: "ESTIMATE_CHANGED",
            field: "estimate",
            oldValue: current.estimate ? `${current.estimate} pts` : "none",
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

      const issueUpdateData: any = {};
      if (data.title !== undefined) issueUpdateData.title = data.title;
      if (data.description !== undefined) issueUpdateData.description = data.description;
      if (data.stateId !== undefined) issueUpdateData.stateId = data.stateId;
      if (data.priority !== undefined) issueUpdateData.priority = data.priority;
      if (data.estimate !== undefined) issueUpdateData.estimate = data.estimate;
      if (data.startDate !== undefined)
        issueUpdateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.dueDate !== undefined)
        issueUpdateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (data.cycleId !== undefined) issueUpdateData.cycleId = data.cycleId;
      if (data.moduleId !== undefined) issueUpdateData.moduleId = data.moduleId;
      if (data.parentId !== undefined) issueUpdateData.parentId = data.parentId;
      if (data.isArchived !== undefined) issueUpdateData.isArchived = data.isArchived;

      return tx.issue.update({
        where: { id: issueId },
        data: issueUpdateData,
        include: {
          state: true,
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
          labels: {
            include: { label: true },
          },
          cycle: true,
          module: true,
          createdBy: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
      });
    });

    return NextResponse.json({ issue: updated });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    console.error("Update issue error:", err);
    return NextResponse.json({ error: "Failed to update issue" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    await requireAuth();
    const { issueId } = await params;

    // Soft delete by archiving
    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { isArchived: true },
    });

    return NextResponse.json({ success: true, issue });
  } catch {
    return NextResponse.json({ error: "Failed to archive issue" }, { status: 500 });
  }
}
