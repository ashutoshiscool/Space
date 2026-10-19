import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const createWorklogSchema = z.object({
  timeSpent: z.number().int().min(1, "Time spent must be at least 1 minute"),
  description: z.string().optional(),
  loggedAt: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    await requireIssueAccess(issueId);

    const worklogs = await prisma.issueWorklog.findMany({
      where: { issueId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { loggedAt: "desc" },
    });

    const totalLoggedMinutes = worklogs.reduce((sum, w) => sum + w.timeSpent, 0);

    return NextResponse.json({ worklogs, totalLoggedMinutes });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch worklogs" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { user } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const data = createWorklogSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const worklog = await tx.issueWorklog.create({
        data: {
          issueId,
          userId: user.id,
          timeSpent: data.timeSpent,
          description: data.description?.trim(),
          loggedAt: data.loggedAt ? new Date(data.loggedAt) : new Date(),
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        },
      });

      // Update total timeSpent on issue
      const allWorklogs = await tx.issueWorklog.findMany({
        where: { issueId },
        select: { timeSpent: true },
      });
      const totalMinutes = allWorklogs.reduce((sum, w) => sum + w.timeSpent, 0);

      await tx.issue.update({
        where: { id: issueId },
        data: { timeSpent: totalMinutes },
      });

      // Add audit activity
      await tx.issueActivity.create({
        data: {
          issueId,
          userId: user.id,
          action: "WORKLOG_ADDED",
          field: "timeSpent",
          newValue: `${data.timeSpent}m`,
        },
      });

      return { worklog, totalMinutes };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to log work" }, { status: 500 });
  }
}
