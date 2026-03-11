import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  issueEmailVerificationCode,
  VerificationCooldownError,
} from "@/lib/accountSecurity";
import { sendEmailVerificationCode } from "@/lib/notificationDelivery";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "Email is already verified." });
    }

    const verification = await issueEmailVerificationCode(user.id);
    await sendEmailVerificationCode({
      toEmail: user.email,
      code: verification.code,
    });

    return NextResponse.json({
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    if (error instanceof VerificationCooldownError) {
      return NextResponse.json({ message: error.message }, { status: 429 });
    }

    if (error instanceof Error) {
      console.error("Verification delivery failure:", error.message);
    }

    console.error("Verification request error", error);
    return NextResponse.json({ message: "Could not send verification code." }, { status: 500 });
  }
}
