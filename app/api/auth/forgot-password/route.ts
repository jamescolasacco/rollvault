import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  hasAtLeastOneIdentifierCandidate,
  parseSignInIdentifier,
} from "@/lib/account";
import {
  generatePasswordResetToken,
  hashSecret,
  PASSWORD_RESET_TTL_MINUTES,
} from "@/lib/accountSecurity";
import { sendPasswordResetEmail } from "@/lib/notificationDelivery";

const GENERIC_RESPONSE =
  "If that account exists, password reset instructions have been sent.";

export async function POST(req: Request) {
  try {
    const { identifier } = await req.json();
    if (!identifier || typeof identifier !== "string") {
      return NextResponse.json({ message: "Identifier is required." }, { status: 400 });
    }

    const rawIdentifier = identifier.trim();
    const candidates = parseSignInIdentifier(identifier);
    if (!hasAtLeastOneIdentifierCandidate(candidates)) {
      return NextResponse.json({ message: GENERIC_RESPONSE }, { status: 200 });
    }

    const orConditions: Array<{ email?: string; username?: string }> = [];
    if (candidates.email) orConditions.push({ email: candidates.email });
    if (candidates.username) orConditions.push({ username: candidates.username });
    if (candidates.username && rawIdentifier !== candidates.username) {
      orConditions.push({ username: rawIdentifier });
    }

    const user = await prisma.user.findFirst({
      where: { OR: orConditions },
      select: { id: true, email: true },
    });

    let resetToken: string | null = null;
    let resetLink: string | null = null;
    if (user) {
      const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
      resetToken = generatePasswordResetToken();
      const origin = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin;
      resetLink = `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({
          where: {
            userId: user.id,
            usedAt: null,
          },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash: hashSecret(resetToken),
            expiresAt,
          },
        }),
      ]);

      if (resetLink) {
        try {
          await sendPasswordResetEmail({ toEmail: user.email, resetLink });
        } catch (deliveryError) {
          console.error("Password reset email delivery failed:", deliveryError);
        }
      }
    }

    return NextResponse.json({ message: GENERIC_RESPONSE });
  } catch (error) {
    console.error("Forgot password error", error);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
