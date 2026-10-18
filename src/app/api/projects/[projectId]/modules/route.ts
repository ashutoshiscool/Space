import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { StateGroup } from "@prisma/client";
import { z } from "zod";

const createModuleSchema = z.object({
  name: z.string().min(1, "Module name is required"),
  description: z.string().optional(),
  status: z.string().default("PLANNED"),
  leadId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  targetDate: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId, ["OWNER", "ADMIN", "MEMBER", "GUEST"]);

    const modules = await prisma.module.findMany({
      where: { projectId },
      include: {
        issues: {
          where: { isArchived: false },
          include: { state: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userIds = modules.map((m) => m.leadId).filter(Boolean) as string[];
    const leads = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    const leadMap = new Map(leads.map((l) => [l.id, l]));

    const modulesWithStats = modules.map((mod) => {
      const totalIssues = mod.issues.length;
      const completedIssues = mod.issues.filter(
        (i) => i.state.group === StateGroup.COMPLETED
      ).length;
      const progressPercent =
        totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

      return {
        ...mod,
        totalIssues,
        completedIssues,
        progressPercent,
        lead: mod.leadId ? leadMap.get(mod.leadId) || null : null,
      };
    });

    return NextResponse.json({ modules: modulesWithStats });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "PROJECT_NOT_FOUND") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN_PROJECT_ACCESS" || message === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: access denied" }, { status: 403 });
    }
    console.error("Fetch modules error:", err);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId, ["OWNER", "ADMIN", "MEMBER"]);
    const body = await req.json();
    const data = createModuleSchema.parse(body);

    const mod = await prisma.module.create({
      data: {
        projectId,
        name: data.name,
        description: data.description,
        status: data.status,
        leadId: data.leadId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      },
    });

    return NextResponse.json({ module: mod });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (message === "PROJECT_NOT_FOUND") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (message === "FORBIDDEN_PROJECT_ACCESS" || message === "INSUFFICIENT_PERMISSIONS") {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
