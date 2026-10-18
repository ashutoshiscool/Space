import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { StateGroup } from "@prisma/client";
import { z } from "zod";

const completeCycleSchema = z.object({
  rolloverToCycleId: z.string().nullable().optional(), // target cycle id or null for backlog
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cycleId: string }> }
) {
  try {
    await requireAuth();
    const { cycleId } = await params;
    const body = await req.json();
    const { rolloverToCycleId } = completeCycleSchema.parse(body);

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: {
        issues: {
          include: { state: true },
        },
      },
    });

    if (!cycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Identify incomplete issues (state group is not COMPLETED or CANCELED)
    const incompleteIssues = cycle.issues.filter(
      (issue) =>
        issue.state.group !== StateGroup.COMPLETED &&
        issue.state.group !== StateGroup.CANCELED
    );

    await prisma.$transaction(async (tx) => {
      // 1. Mark cycle as completed
      await tx.cycle.update({
        where: { id: cycleId },
        data: { isCompleted: true },
      });

      // 2. Rollover incomplete issues if any
      if (incompleteIssues.length > 0) {
        await tx.issue.updateMany({
          where: {
            id: { in: incompleteIssues.map((i) => i.id) },
          },
          data: {
            cycleId: rolloverToCycleId || null,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      completedCycleId: cycleId,
      rolledOverCount: incompleteIssues.length,
      targetCycleId: rolloverToCycleId || "backlog",
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    console.error("Complete cycle error:", err);
    return NextResponse.json({ error: "Failed to complete cycle" }, { status: 500 });
  }
}
