import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth";
import { StateGroup, WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(2),
  identifier: z
    .string()
    .min(2)
    .max(6)
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, "Identifier must contain only uppercase letters and numbers"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { workspace } = await requireWorkspaceMember(slug);

    const projects = await prisma.project.findMany({
      where: { workspaceId: workspace.id },
      include: {
        states: {
          orderBy: { sequence: "asc" },
        },
        labels: true,
        cycles: {
          where: { isCompleted: false },
        },
        modules: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { user, workspace } = await requireWorkspaceMember(slug, [
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
      WorkspaceRole.MEMBER,
    ]);

    const body = await req.json();
    const { name, identifier, description, icon } = createProjectSchema.parse(body);

    const existing = await prisma.project.findUnique({
      where: {
        workspaceId_identifier: {
          workspaceId: workspace.id,
          identifier: identifier.toUpperCase(),
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Identifier "${identifier}" is already in use in this workspace` },
        { status: 400 }
      );
    }

    // Create project with default workflow states and default labels in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const p = await tx.project.create({
        data: {
          workspaceId: workspace.id,
          name,
          identifier: identifier.toUpperCase(),
          description,
          icon: icon || "📁",
          members: {
            create: {
              userId: user.id,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });

      // Seed standard workflow states
      await tx.state.createMany({
        data: [
          {
            projectId: p.id,
            name: "Backlog",
            color: "#94a3b8",
            group: StateGroup.BACKLOG,
            sequence: 1000,
          },
          {
            projectId: p.id,
            name: "Todo",
            color: "#64748b",
            group: StateGroup.UNSTARTED,
            sequence: 2000,
          },
          {
            projectId: p.id,
            name: "In Progress",
            color: "#f59e0b",
            group: StateGroup.STARTED,
            sequence: 3000,
          },
          {
            projectId: p.id,
            name: "Done",
            color: "#10b981",
            group: StateGroup.COMPLETED,
            sequence: 4000,
          },
          {
            projectId: p.id,
            name: "Canceled",
            color: "#ef4444",
            group: StateGroup.CANCELED,
            sequence: 5000,
          },
        ],
      });

      // Seed standard labels
      await tx.label.createMany({
        data: [
          { projectId: p.id, name: "Bug", color: "#ef4444" },
          { projectId: p.id, name: "Feature", color: "#3b82f6" },
          { projectId: p.id, name: "Design", color: "#a855f7" },
          { projectId: p.id, name: "Performance", color: "#10b981" },
        ],
      });

      return p;
    });

    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        states: { orderBy: { sequence: "asc" } },
        labels: true,
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    return NextResponse.json({ project: fullProject });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
