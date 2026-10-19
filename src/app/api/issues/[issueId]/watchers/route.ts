import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { user } = await requireIssueAccess(issueId);

    const watchers = await prisma.issueWatcher.findMany({
      where: { issueId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const isWatching = watchers.some((w) => w.userId === user.id);

    return NextResponse.json({ watchers, isWatching, count: watchers.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch watchers" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const { user } = await requireIssueAccess(issueId);

    // Toggle watch status
    const existing = await prisma.issueWatcher.findUnique({
      where: {
        issueId_userId: {
          issueId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      await prisma.issueWatcher.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ isWatching: false });
    } else {
      await prisma.issueWatcher.create({
        data: {
          issueId,
          userId: user.id,
        },
      });
      return NextResponse.json({ isWatching: true }, { status: 201 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update watcher status" }, { status: 500 });
  }
}
