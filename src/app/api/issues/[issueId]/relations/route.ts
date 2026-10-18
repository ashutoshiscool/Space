import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireIssueAccess } from "@/lib/auth";
import { RelationType, WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const relationSchema = z.object({
  targetId: z.string(),
  type: z.nativeEnum(RelationType).default(RelationType.RELATED),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    // Enforce tenant authorization on source issue
    const { issue: sourceIssue } = await requireIssueAccess(issueId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const { targetId, type } = relationSchema.parse(body);

    if (issueId === targetId) {
      return NextResponse.json(
        { error: "An issue cannot be related to itself" },
        { status: 400 }
      );
    }

    // Verify target issue exists AND belongs to the same project or workspace
    const targetIssue = await prisma.issue.findUnique({
      where: { id: targetId },
      include: { project: true },
    });

    if (!targetIssue || targetIssue.project.workspaceId !== sourceIssue.project.workspaceId) {
      return NextResponse.json(
        { error: "Target issue not found or belongs to a different workspace" },
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
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_ISSUE_ACCESS" || msg === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create relation" }, { status: 500 });
  }
}
