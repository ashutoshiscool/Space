import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { IssuePriority, Prisma } from "@prisma/client";
import { z } from "zod";

const createIssueSchema = z.object({
  title: z.string().min(1, "Title is required"),
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
    await requireAuth();
    const { projectId } = await params;
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
      // Check if user searched for "SPC-12" or "12"
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
  } catch (err) {
    console.error("Fetch issues error:", err);
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
    const body = await req.json();
    const data = createIssueSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Atomic transaction for sequenceId generation and relations
    const issue = await prisma.$transaction(async (tx) => {
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

    return NextResponse.json({ issue });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    console.error("Create issue error:", err);
    return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
  }
}
