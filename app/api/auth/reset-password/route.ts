import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePassword } from "@/lib/account";
import { hashSecret } from "@/lib/accountSecurity";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ message: "Invalid reset token." }, { status: 400 });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ message: passwordError }, { status: 400 });
    }

    const hashedToken = hashSecret(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashedToken },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= new Date()) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedPassword,
          failedSignInAttempts: 0,
          lockoutUntil: null,
        },
      }),
      prisma.passwordResetToken.updateMany({
        where: { userId: resetRecord.userId, usedAt: null },
        data: { usedAt: now },
      }),
    ]);

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Reset password error", error);
    return NextResponse.json({ message: "Unable to reset password." }, { status: 500 });
  }
}
