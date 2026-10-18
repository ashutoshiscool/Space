import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { StateGroup, WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const createCycleSchema = z.object({
  name: z.string().min(1, "Cycle name is required").max(100),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    // Enforce project membership authorization
    await requireProjectMember(projectId);

    const cycles = await prisma.cycle.findMany({
      where: { projectId },
      include: {
        issues: {
          where: { isArchived: false },
          include: {
            state: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const cyclesWithMetrics = cycles.map((cycle) => {
      const totalIssues = cycle.issues.length;
      const completedIssues = cycle.issues.filter(
        (i) => i.state.group === StateGroup.COMPLETED
      ).length;
      const totalPoints = cycle.issues.reduce((sum, i) => sum + (i.estimate || 0), 0);
      const completedPoints = cycle.issues
        .filter((i) => i.state.group === StateGroup.COMPLETED)
        .reduce((sum, i) => sum + (i.estimate || 0), 0);

      const progressPercent =
        totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      const durationDays = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      const burndown = [];
      const totalInitialScope = totalPoints > 0 ? totalPoints : totalIssues;
      const remainingScope = totalInitialScope - (totalPoints > 0 ? completedPoints : completedIssues);

      for (let day = 0; day <= durationDays; day++) {
        const currentDate = new Date(start.getTime() + day * 24 * 60 * 60 * 1000);
        const dayRatio = day / durationDays;
        const idealRemaining = Math.max(0, Math.round(totalInitialScope * (1 - dayRatio)));

        const isPastOrToday = currentDate <= new Date();
        const actualRemaining = isPastOrToday
          ? Math.max(0, Math.round(totalInitialScope - ((totalInitialScope - remainingScope) * Math.min(1, dayRatio * 1.2))))
          : null;

        burndown.push({
          date: currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          idealRemaining,
          actualRemaining,
        });
      }

      return {
        ...cycle,
        totalIssues,
        completedIssues,
        totalPoints,
        completedPoints,
        progressPercent,
        burndown,
      };
    });

    return NextResponse.json({ cycles: cyclesWithMetrics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No access to this project" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch cycles" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    // Members, Admins, and Owners can create cycles (Guests blocked)
    await requireProjectMember(projectId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const data = createCycleSchema.parse(body);

    const cycle = await prisma.cycle.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isCompleted: false,
      },
    });

    return NextResponse.json({ cycle });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: No permission to create cycles" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create cycle" }, { status: 500 });
  }
}
