import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const createComponentSchema = z.object({
  name: z.string().min(1, "Component name is required").max(60),
  description: z.string().optional(),
  leadId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId);

    const components = await prisma.component.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { issues: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ components });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS") {
      return NextResponse.json({ error: "Forbidden: Not a member of this project" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId, [
      WorkspaceRole.MEMBER,
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const data = createComponentSchema.parse(body);

    const component = await prisma.component.create({
      data: {
        projectId,
        name: data.name.trim(),
        description: data.description?.trim(),
        leadId: data.leadId || null,
      },
    });

    return NextResponse.json({ component }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN_PROJECT_ACCESS") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create component" }, { status: 500 });
  }
}
