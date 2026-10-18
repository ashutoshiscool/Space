import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const notif = await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, count: notif.count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
