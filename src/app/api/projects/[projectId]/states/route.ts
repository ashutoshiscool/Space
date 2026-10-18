import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { StateGroup, WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const createStateSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().default("#94a3b8"),
  group: z.nativeEnum(StateGroup).default(StateGroup.UNSTARTED),
  sequence: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId);

    const states = await prisma.state.findMany({
      where: { projectId },
      orderBy: { sequence: "asc" },
      include: {
        _count: {
          select: { issues: { where: { isArchived: false } } },
        },
      },
    });

    return NextResponse.json({ states });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch states" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    // Administrative action: requires ADMIN or OWNER
    await requireProjectMember(projectId, [WorkspaceRole.ADMIN, WorkspaceRole.OWNER]);

    const body = await req.json();
    const { name, color, group, sequence } = createStateSchema.parse(body);

    const highestSeq = await prisma.state.findFirst({
      where: { projectId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });

    const newSeq = sequence ?? (highestSeq ? highestSeq.sequence + 1000 : 1000);

    const state = await prisma.state.create({
      data: {
        projectId,
        name,
        color,
        group,
        sequence: newSeq,
      },
    });

    return NextResponse.json({ state });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: Only Admins and Owners can manage states" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
  }
}
