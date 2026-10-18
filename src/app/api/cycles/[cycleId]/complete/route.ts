import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCycleAccess } from "@/lib/auth";
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
    const { cycleId } = await params;
    const { cycle } = await requireCycleAccess(cycleId, ["OWNER", "ADMIN", "MEMBER"]);
    const body = await req.json();
    const { rolloverToCycleId } = completeCycleSchema.parse(body);

    if (rolloverToCycleId) {
      const targetCycle = await prisma.cycle.findUnique({
        where: { id: rolloverToCycleId },
        select: { id: true, projectId: true },
      });
      if (!targetCycle || targetCycle.projectId !== cycle.projectId) {
        return NextResponse.json(
          { error: "Target rollover cycle does not exist in this project" },
          { status: 400 }
        );
      }
    }

    const fullCycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: {
        issues: {
          include: { state: true },
        },
      },
    });

    if (!fullCycle) {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }

    // Identify incomplete issues (state group is not COMPLETED or CANCELED)
    const incompleteIssues = fullCycle.issues.filter(
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
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "CYCLE_NOT_FOUND") {
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN_CYCLE_ACCESS" || message === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }
    console.error("Complete cycle error:", err);
    return NextResponse.json({ error: "Failed to complete cycle" }, { status: 500 });
  }
}
