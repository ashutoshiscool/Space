import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { workspace } = await requireWorkspaceMember(slug);

    const fullWorkspace = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      include: {
        projects: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true },
                },
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        invitations: true,
      },
    });

    return NextResponse.json({ workspace: fullWorkspace });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error";
    if (errorMsg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (errorMsg === "FORBIDDEN_WORKSPACE_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
}
