import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { StateGroup } from "@prisma/client";
import { z } from "zod";

const createStateSchema = z.object({
  name: z.string().min(1),
  color: z.string().default("#94a3b8"),
  group: z.nativeEnum(StateGroup).default(StateGroup.UNSTARTED),
  sequence: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireAuth();
    const { projectId } = await params;

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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await requireAuth();
    const { projectId } = await params;
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
    return NextResponse.json({ error: "Failed to create state" }, { status: 500 });
  }
}
