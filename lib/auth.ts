import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import {
    hasAtLeastOneIdentifierCandidate,
    parseSignInIdentifier,
} from "./account";
import {
    getVerificationCooldownRemainingSeconds,
    hashSecret,
    issueEmailVerificationCode,
    VERIFICATION_CODE_COOLDOWN_SECONDS,
    VERIFICATION_CODE_LENGTH,
    VERIFICATION_MAX_ATTEMPTS,
    VerificationCooldownError,
} from "./accountSecurity";
import { sendEmailVerificationCode } from "./notificationDelivery";
import { verifyTotpCode } from "./totp";
import { pruneExpiredUnverifiedAccounts } from "./accountLifecycle";

const MAX_FAILED_SIGN_INS = 5;
const LOCKOUT_MINUTES = 15;

export const authOptions: NextAuthOptions = {
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                identifier: { label: "Email / Username", type: "text" },
                password: { label: "Password", type: "password" },
                emailCode: { label: "Email Verification Code", type: "text" },
                totpCode: { label: "Authenticator Code", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) return null;
                await pruneExpiredUnverifiedAccounts();

                const rawIdentifier = credentials.identifier.trim();
                const candidates = parseSignInIdentifier(credentials.identifier);
                if (!hasAtLeastOneIdentifierCandidate(candidates)) return null;

                const orConditions: Array<{ email?: string; username?: string }> = [];
                if (candidates.email) orConditions.push({ email: candidates.email });
                if (candidates.username) orConditions.push({ username: candidates.username });
                if (candidates.username && rawIdentifier !== candidates.username) {
                    orConditions.push({ username: rawIdentifier });
                }

                const user = await prisma.user.findFirst({
                    where: { OR: orConditions },
                });

                if (!user) return null;

                const now = new Date();
                if (user.lockoutUntil && user.lockoutUntil > now) {
                    return null;
                }

                const registerFailedAttempt = async () => {
                    const nextFailedAttempts = user.failedSignInAttempts + 1;
                    const lockoutUntil =
                        nextFailedAttempts >= MAX_FAILED_SIGN_INS
                            ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
                            : null;

                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedSignInAttempts: nextFailedAttempts,
                            lockoutUntil,
                        },
                    });
                };

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    await registerFailedAttempt();
                    return null;
                }

                if (!user.emailVerified) {
                    const emailCode = credentials.emailCode?.trim();

                    if (!emailCode) {
                        let retryAfterSeconds = VERIFICATION_CODE_COOLDOWN_SECONDS;
                        try {
                            const verification = await issueEmailVerificationCode(user.id);
                            await sendEmailVerificationCode({
                                toEmail: user.email,
                                code: verification.code,
                            });
                        } catch (error) {
                            if (error instanceof VerificationCooldownError) {
                                retryAfterSeconds = error.retryAfterSeconds;
                            } else {
                                console.error("Login email verification send failed:", error);
                                retryAfterSeconds = await getVerificationCooldownRemainingSeconds(
                                    user.id
                                );
                            }
                        }
                        throw new Error(`EMAIL_VERIFICATION_REQUIRED:${retryAfterSeconds}`);
                    }

                    if (!new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`).test(emailCode)) {
                        await registerFailedAttempt();
                        throw new Error("EMAIL_VERIFICATION_INVALID");
                    }

                    const latestVerification = await prisma.verificationCode.findFirst({
                        where: {
                            userId: user.id,
                            consumedAt: null,
                        },
                        orderBy: { createdAt: "desc" },
                    });

                    if (!latestVerification || latestVerification.expiresAt <= now) {
                        if (latestVerification && latestVerification.consumedAt === null) {
                            await prisma.verificationCode.update({
                                where: { id: latestVerification.id },
                                data: { consumedAt: new Date() },
                            });
                        }
                        await registerFailedAttempt();
                        throw new Error("EMAIL_VERIFICATION_INVALID");
                    }

                    const emailCodeMatches = hashSecret(emailCode) === latestVerification.codeHash;
                    if (!emailCodeMatches) {
                        const nextAttempts = latestVerification.attempts + 1;
                        await prisma.verificationCode.update({
                            where: { id: latestVerification.id },
                            data: {
                                attempts: nextAttempts,
                                consumedAt:
                                    nextAttempts >= VERIFICATION_MAX_ATTEMPTS ? new Date() : null,
                            },
                        });
                        await registerFailedAttempt();
                        throw new Error("EMAIL_VERIFICATION_INVALID");
                    }

                    await prisma.$transaction([
                        prisma.verificationCode.update({
                            where: { id: latestVerification.id },
                            data: { consumedAt: new Date(), attempts: latestVerification.attempts + 1 },
                        }),
                        prisma.user.update({
                            where: { id: user.id },
                            data: { emailVerified: true },
                        }),
                    ]);

                    user.emailVerified = true;
                }

                if (user.totpEnabled) {
                    const code = credentials.totpCode?.trim();
                    if (!code) {
                        throw new Error("MFA_REQUIRED");
                    }

                    if (!user.totpSecret) {
                        await registerFailedAttempt();
                        return null;
                    }

                    const validTotp = verifyTotpCode({
                        secret: user.totpSecret,
                        code,
                    });
                    if (!validTotp) {
                        await registerFailedAttempt();
                        throw new Error("MFA_INVALID");
                    }
                }

                if (user.failedSignInAttempts > 0 || user.lockoutUntil) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            failedSignInAttempts: 0,
                            lockoutUntil: null,
                        },
                    });
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.username,
                    emailVerified: user.emailVerified,
                    mfaEnabled: user.totpEnabled,
                };
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.emailVerified = Boolean(token.emailVerified);
                session.user.mfaEnabled = Boolean(token.mfaEnabled);
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                const userWithVerification = user as typeof user & {
                    emailVerified?: boolean;
                    mfaEnabled?: boolean;
                };
                token.id = user.id;
                token.name = user.name;
                token.emailVerified = Boolean(userWithVerification.emailVerified);
                token.mfaEnabled = Boolean(userWithVerification.mfaEnabled);
            }

            if (trigger === "update" && session?.user) {
                token.name = session.user.name;
                token.emailVerified = session.user.emailVerified;
                token.mfaEnabled = session.user.mfaEnabled;
            }
            return token;
        },
    },
};
