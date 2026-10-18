import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
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

    return NextResponse.json({
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        workspace: invite.workspace,
      },
    });
  } catch (err) {
    console.error("Fetch invite error:", err);
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 });
  }
}
