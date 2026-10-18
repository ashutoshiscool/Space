import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { z } from "zod";

const updatePageSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  isPublic: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        project: {
          select: {
            id: true,
            name: true,
            identifier: true,
            workspace: { select: { slug: true } },
          },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }

    if (!page.isPublic) {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAuth();
    const { pageId } = await params;
    const body = await req.json();
    const data = updatePageSchema.parse(body);

    const page = await prisma.page.update({
      where: { id: pageId },
      data,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ page });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAuth();
    const { pageId } = await params;

    await prisma.page.delete({
      where: { id: pageId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
