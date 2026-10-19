import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMember } from "@/lib/auth";
import { sendWorkspaceInviteEmail } from "@/lib/event-notifications";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.MEMBER),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    // Require ADMIN or OWNER role
    const { workspace, user } = await requireWorkspaceMember(slug, [
      WorkspaceRole.ADMIN,
      WorkspaceRole.OWNER,
    ]);

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await prisma.workspaceInvite.upsert({
      where: {
        workspaceId_email: {
          workspaceId: workspace.id,
          email: email.toLowerCase(),
        },
      },
      update: {
        role,
        token,
        expiresAt,
      },
      create: {
        workspaceId: workspace.id,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt,
      },
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000"}/join?token=${token}`;

    // Dispatch workspace invitation email asynchronously (non-blocking)
    sendWorkspaceInviteEmail({
      workspaceName: workspace.name,
      workspaceSlug: workspace.slug,
      inviterName: user.name || "A workspace member",
      inviteeEmail: email.toLowerCase(),
      role,
      inviteUrl,
    }).catch((err) => console.error("Error sending invite email:", err));

    return NextResponse.json({
      invite,
      inviteUrl,
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
