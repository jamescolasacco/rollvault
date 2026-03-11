import crypto from "crypto";
import { prisma } from "./prisma";

export const VERIFICATION_CODE_LENGTH = 6;
export const VERIFICATION_CODE_TTL_MINUTES = 15;
export const VERIFICATION_CODE_COOLDOWN_SECONDS = 60;
export const VERIFICATION_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_TTL_MINUTES = 30;
export const EMAIL_CHANGE_TOKEN_TTL_MINUTES = 60;

export class VerificationCooldownError extends Error {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message?: string) {
    const safeRetryAfter = Math.max(1, Math.ceil(retryAfterSeconds));
    super(
      message ??
        `Please wait ${safeRetryAfter} second${safeRetryAfter === 1 ? "" : "s"} before requesting a new code.`
    );
    this.name = "VerificationCooldownError";
    this.retryAfterSeconds = safeRetryAfter;
  }
}

export async function getVerificationCooldownRemainingSeconds(
  userId: string
): Promise<number> {
  const recentCode = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!recentCode) return 0;

  const nowMs = Date.now();
  const cooldownEndsAtMs =
    recentCode.createdAt.getTime() + VERIFICATION_CODE_COOLDOWN_SECONDS * 1000;
  const remainingMs = cooldownEndsAtMs - nowMs;

  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}

export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateNumericCode(length = VERIFICATION_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += crypto.randomInt(0, 10).toString();
  }
  return code;
}

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function issueEmailVerificationCode(userId: string) {
  const cooldownRemainingSeconds = await getVerificationCooldownRemainingSeconds(
    userId
  );
  if (cooldownRemainingSeconds > 0) {
    throw new VerificationCooldownError(cooldownRemainingSeconds);
  }

  const now = new Date();

  await prisma.verificationCode.updateMany({
    where: {
      userId,
      consumedAt: null,
    },
    data: { consumedAt: now },
  });

  const code = generateNumericCode();
  const expiresAt = new Date(now.getTime() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);

  await prisma.verificationCode.create({
    data: {
      userId,
      codeHash: hashSecret(code),
      expiresAt,
    },
  });

  return { code, expiresAt };
}
