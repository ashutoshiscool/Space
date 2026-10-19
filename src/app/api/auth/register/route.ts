import { formatZodError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, setSessionCookie } from "@/lib/auth";
import { isSmtpSetUp, sendUserVerificationEmail } from "@/lib/verification";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    // Check if SMTP delivery is set up and configured
    const isSmtpReady = await isSmtpSetUp();

    if (isSmtpReady) {
      const origin = req.headers.get("origin") || req.nextUrl.origin;
      const sendResult = await sendUserVerificationEmail({
        userId: user.id,
        email: user.email,
        name: user.name,
        origin,
      });

      if (sendResult.sent) {
        // SMTP verification is required - do not set session cookie yet
        return NextResponse.json({
          user: { id: user.id, email: user.email, name: user.name },
          requiresVerification: true,
          email: user.email,
          message: "Verification email sent. Please check your inbox.",
        });
      }
    }

    // If SMTP is not set up (or delivery failed), let the user in immediately
    const token = await signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    await setSessionCookie(token);

    return NextResponse.json({ user, requiresVerification: false });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: formatZodError(err) }, { status: 400 });
    }
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
