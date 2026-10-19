import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { IssuePriority, WorkspaceRole } from "@/lib/types";
import type { Prisma } from ".prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";
import {
  dispatchEventNotification,
  extractMentionedUserIds,
} from "@/lib/event-notifications";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  description: z.string().optional(),
  stateId: z.string(),
  priority: z.nativeEnum(IssuePriority).default(IssuePriority.NONE),
  estimate: z.number().int().nullable().optional(),
  startDate: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  cycleId: z.string().nullable().optional(),
  moduleId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).default([]),
  labelIds: z.array(z.string()).default([]),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    // Enforce project membership authorization
    await requireProjectMember(projectId);

    const { searchParams } = new URL(req.url);

    const stateId = searchParams.get("stateId");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const cycleId = searchParams.get("cycleId");
    const moduleId = searchParams.get("moduleId");
    const search = searchParams.get("search");

    const where: Prisma.IssueWhereInput = {
      projectId,
      isArchived: false,
    };

    if (stateId) {
      const stateList = stateId.split(",").filter(Boolean);
      if (stateList.length > 0) {
        where.stateId = { in: stateList };
      }
    }

    if (priority) {
      const prioList = priority.split(",").filter(Boolean) as IssuePriority[];
      if (prioList.length > 0) {
        where.priority = { in: prioList };
      }
    }

    if (assigneeId) {
      const assigneeList = assigneeId.split(",").filter(Boolean);
      if (assigneeList.length > 0) {
        where.assignees = {
          some: { userId: { in: assigneeList } },
        };
      }
    }

    if (cycleId) {
      where.cycleId = cycleId === "none" ? null : cycleId;
    }

    if (moduleId) {
      where.moduleId = moduleId === "none" ? null : moduleId;
    }

    if (search && search.trim().length > 0) {
      const cleanSearch = search.trim();
      const numberMatch = cleanSearch.match(/\d+/);
      const searchNum = numberMatch ? parseInt(numberMatch[0], 10) : null;

      where.OR = [
        { title: { contains: cleanSearch, mode: "insensitive" } },
        { description: { contains: cleanSearch, mode: "insensitive" } },
        ...(searchNum ? [{ sequenceId: searchNum }] : []),
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
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
        _count: {
          select: {
            comments: true,
            subIssues: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json({ issues });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    // Enforce role: Members, Admins, and Owners can create issues (Guests blocked)
    const { user, project, workspace } = await requireProjectMember(projectId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const data = createIssueSchema.parse(body);

    // Verify state belongs to this project
    const targetState = await prisma.state.findFirst({
      where: { id: data.stateId, projectId },
    });
    if (!targetState) {
      return NextResponse.json({ error: "Invalid state for this project" }, { status: 400 });
    }

    // Atomic transaction for sequenceId generation and relations
    const issue = await prisma.$transaction(async (tx: any) => {
      // Exclusively lock the parent Project row to serialize sequenceId generation under concurrency
      await tx.$executeRaw`SELECT id FROM "Project" WHERE id = ${projectId} FOR UPDATE`;

      const maxIssue = await tx.issue.findFirst({
        where: { projectId },
        orderBy: { sequenceId: "desc" },
        select: { sequenceId: true },
      });

      const nextSequenceId = (maxIssue?.sequenceId ?? 0) + 1;

      const created = await tx.issue.create({
        data: {
          projectId,
          sequenceId: nextSequenceId,
          title: data.title,
          description: data.description,
          stateId: data.stateId,
          priority: data.priority,
          estimate: data.estimate,
          startDate: data.startDate ? new Date(data.startDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          cycleId: data.cycleId,
          moduleId: data.moduleId,
          parentId: data.parentId,
          createdById: user.id,
          assignees: {
            create: data.assigneeIds.map((userId) => ({ userId })),
          },
          labels: {
            create: data.labelIds.map((labelId) => ({ labelId })),
          },
          activities: {
            create: {
              userId: user.id,
              action: "CREATED",
              newValue: `Created ${project.identifier}-${nextSequenceId}`,
            },
          },
        },
        include: {
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
        },
      });

      // Notify assignees (if not the creator)
      for (const aId of data.assigneeIds) {
        if (aId !== user.id) {
          await tx.notification.create({
            data: {
              userId: aId,
              title: `Assigned to ${project.identifier}-${nextSequenceId}`,
              message: `${user.name} assigned you to "${data.title}"`,
              link: `/${project.workspaceId}/${project.identifier}/issues`,
            },
          });
        }
      }

      return created;
    });

    // Extract any mentions in issue description
    const mentionedUserIds = await extractMentionedUserIds(
      data.description || "",
      projectId
    );

    // Dispatch Space event notifications (email + in-app)
    dispatchEventNotification({
      type: "ISSUE_CREATED",
      workspaceSlug: workspace?.slug || project.workspaceId,
      projectId: project.id,
      projectIdentifier: project.identifier,
      projectName: project.name,
      issueId: issue.id,
      sequenceId: issue.sequenceId,
      issueTitle: issue.title,
      issueDescription: issue.description,
      actor: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      details: {
        assignedUserIds: data.assigneeIds,
        mentionedUserIds,
      },
    }).catch((err) =>
      console.error("[Notifications] Issue creation dispatch error:", err)
    );

    if (data.assigneeIds.length > 0) {
      dispatchEventNotification({
        type: "ISSUE_ASSIGNED",
        workspaceSlug: workspace?.slug || project.workspaceId,
        projectId: project.id,
        projectIdentifier: project.identifier,
        projectName: project.name,
        issueId: issue.id,
        sequenceId: issue.sequenceId,
        issueTitle: issue.title,
        actor: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        details: {
          assignedUserIds: data.assigneeIds,
        },
      }).catch((err) =>
        console.error("[Notifications] Issue assign dispatch error:", err)
      );
    }

    return NextResponse.json({ issue });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No permission to create issues in this project" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
