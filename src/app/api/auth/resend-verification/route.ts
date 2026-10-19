import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isSmtpSetUp, sendUserVerificationEmail } from "@/lib/verification";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = resendSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Return ok to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    const isSmtpReady = await isSmtpSetUp();
    if (!isSmtpReady) {
      return NextResponse.json(
        { error: "SMTP is not currently configured on this instance" },
        { status: 400 }
      );
    }

    const origin = req.headers.get("origin") || req.nextUrl.origin;
    const result = await sendUserVerificationEmail({
      userId: user.id,
      email: user.email,
      name: user.name,
      origin,
    });

    if (!result.sent) {
      return NextResponse.json(
        { error: result.error || "Failed to dispatch verification email" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully.",
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message || "Invalid email" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
