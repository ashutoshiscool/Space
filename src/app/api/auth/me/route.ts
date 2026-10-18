import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: {
            workspace: {
              include: {
                projects: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ user: fullUser });
  } catch (err) {
    console.error("Auth me error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
