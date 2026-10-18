import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { formatZodError } from "@/lib/utils";

const acceptSchema = z.object({
  token: z.string().min(1, "Invitation token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { token } = acceptSchema.parse(body);

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Invitation has expired", expired: true },
        { status: 410 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Add or update user as workspace member
      await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invite.workspaceId,
            userId: user.id,
          },
        },
        update: {
          role: invite.role,
        },
        create: {
          workspaceId: invite.workspaceId,
          userId: user.id,
          role: invite.role,
        },
      });

      // 2. Consume the invitation token
      await tx.workspaceInvite.delete({
        where: { id: invite.id },
      });
    });

    return NextResponse.json({
      success: true,
      workspaceSlug: invite.workspace.slug,
      workspaceName: invite.workspace.name,
      role: invite.role,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Accept invitation error:", err);
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }
}
