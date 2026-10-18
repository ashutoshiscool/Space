import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
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
    await requireAuth();
    const { projectId } = await params;

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
    console.error("Fetch pages error:", err);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await requireAuth();
    const { projectId } = await params;
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
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 });
  }
}
