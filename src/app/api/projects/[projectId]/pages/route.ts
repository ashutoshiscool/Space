import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireProjectMember } from "@/lib/auth";
import { z } from "zod";

const createPageSchema = z.object({
  title: z.string().min(1, "Page title is required"),
  content: z.string().optional(),
  parentId: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    await requireProjectMember(projectId, ["OWNER", "ADMIN", "MEMBER", "GUEST"]);

    const pages = await prisma.page.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        children: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ pages });
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
    console.error("Fetch pages error:", err);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { user } = await requireProjectMember(projectId, ["OWNER", "ADMIN", "MEMBER"]);
    const body = await req.json();
    const data = createPageSchema.parse(body);

    const page = await prisma.page.create({
      data: {
        projectId,
        userId: user.id,
        title: data.title,
        content: data.content || "<p></p>",
        parentId: data.parentId,
        isPublic: data.isPublic,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ page });
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
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
