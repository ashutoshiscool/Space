import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { RelationType } from "@prisma/client";
import { z } from "zod";

const relationSchema = z.object({
  targetId: z.string(),
  type: z.nativeEnum(RelationType).default(RelationType.RELATED),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    await requireAuth();
    const { issueId } = await params;
    const body = await req.json();
    const { targetId, type } = relationSchema.parse(body);

    if (issueId === targetId) {
      return NextResponse.json(
        { error: "An issue cannot be related to itself" },
        { status: 400 }
      );
    }

    const relation = await prisma.issueRelation.upsert({
      where: {
        sourceId_targetId_type: {
          sourceId: issueId,
          targetId,
          type,
        },
      },
      update: { type },
      create: {
        sourceId: issueId,
        targetId,
        type,
      },
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
    });

    return NextResponse.json({ relation });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create relation" }, { status: 500 });
  }
}
