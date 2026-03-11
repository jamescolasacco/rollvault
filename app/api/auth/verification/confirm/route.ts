import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  hashSecret,
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_MAX_ATTEMPTS,
} from "@/lib/accountSecurity";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (
      typeof code !== "string" ||
      !new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`).test(code)
    ) {
      return NextResponse.json(
        { message: `Code must be ${VERIFICATION_CODE_LENGTH} digits.` },
        { status: 400 }
      );
    }

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: session.user.id,
        consumedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    if (!currentUser) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (!verification || verification.expiresAt <= new Date()) {
      if (verification && verification.consumedAt === null) {
        await prisma.verificationCode.update({
          where: { id: verification.id },
          data: { consumedAt: new Date() },
        });
      }
      return NextResponse.json(
        { message: "Code is invalid or expired. Request a new code." },
        { status: 400 }
      );
    }

    const matches = hashSecret(code) === verification.codeHash;

    if (!matches) {
      const nextAttempts = verification.attempts + 1;
      await prisma.verificationCode.update({
        where: { id: verification.id },
        data: {
          attempts: nextAttempts,
          consumedAt: nextAttempts >= VERIFICATION_MAX_ATTEMPTS ? new Date() : null,
        },
      });

      if (nextAttempts >= VERIFICATION_MAX_ATTEMPTS) {
        return NextResponse.json(
          { message: "Too many failed attempts. Request a new code." },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: "Incorrect verification code." }, { status: 400 });
    }

    const now = new Date();
    const [, updatedUser] = await prisma.$transaction([
      prisma.verificationCode.update({
        where: { id: verification.id },
        data: { consumedAt: now, attempts: verification.attempts + 1 },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { emailVerified: true, lastVerifiedEmail: currentUser.email },
        select: { emailVerified: true },
      }),
    ]);

    return NextResponse.json({
      message: "Email verified successfully.",
      verification: updatedUser,
    });
  } catch (error) {
    console.error("Verification confirm error", error);
    return NextResponse.json({ message: "Could not verify code." }, { status: 500 });
  }
}
