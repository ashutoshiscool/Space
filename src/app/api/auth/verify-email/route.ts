import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSessionToken, setSessionCookie } from "@/lib/auth";
import { verifyTokenOrCode } from "@/lib/verification";
import { z } from "zod";

const verifySchema = z.object({
  token: z.string().optional(),
  code: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, code, email } = verifySchema.parse(body);

    const input = token || code;
    if (!input) {
      return NextResponse.json(
        { error: "Verification token or 6-digit code is required" },
        { status: 400 }
      );
    }

    const result = await verifyTokenOrCode(input, email);
    if (!result.success || !result.userId) {
      return NextResponse.json(
        { error: result.error || "Invalid or expired verification credentials" },
        { status: 400 }
      );
    }

    // Retrieve user and create session
    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessionToken = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
      user,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to verify email" },
      { status: 500 }
    );
  }
}
