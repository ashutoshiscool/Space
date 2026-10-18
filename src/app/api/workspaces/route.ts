import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  logoUrl: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId: user.id },
        },
      },
      include: {
        projects: true,
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ workspaces });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { name, slug, logoUrl } = createWorkspaceSchema.parse(body);

    const existing = await prisma.workspace.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A workspace with this slug already exists" },
        { status: 400 }
      );
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        logoUrl,
        members: {
          create: {
            userId: user.id,
            role: WorkspaceRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ workspace });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    return NextResponse.json({ error: "Unauthorized or failed" }, { status: 500 });
  }
}
