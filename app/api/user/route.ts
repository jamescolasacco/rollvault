import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    isValidEmail,
    normalizeEmail,
} from "@/lib/account";
import {
    EMAIL_CHANGE_TOKEN_TTL_MINUTES,
    generatePasswordResetToken,
    hashSecret,
} from "@/lib/accountSecurity";
import {
    sendEmailChangeConfirmationEmail,
    sendEmailChangeNotice,
} from "@/lib/notificationDelivery";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!session.user.emailVerified) {
            return NextResponse.json({ error: "Email verification required." }, { status: 403 });
        }

        const { bio, avatar, email } = await req.json();

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                emailVerified: true,
                totpEnabled: true,
            },
        });

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const dataToUpdate: Prisma.UserUpdateInput = {};
        if (bio !== undefined) dataToUpdate.bio = bio;
        if (avatar !== undefined) dataToUpdate.avatar = avatar;

        let requestedEmailChange: string | null = null;

        if (email !== undefined) {
            if (typeof email !== "string") {
                return NextResponse.json({ error: "Email must be a string." }, { status: 400 });
            }

            const normalizedEmail = normalizeEmail(email);
            if (!isValidEmail(normalizedEmail)) {
                return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
            }

            if (normalizedEmail !== currentUser.email) {
                const existingEmail = await prisma.user.findFirst({
                    where: {
                        email: normalizedEmail,
                        id: { not: currentUser.id },
                    },
                    select: { id: true },
                });

                if (existingEmail) {
                    return NextResponse.json(
                        { error: "An account with this email already exists." },
                        { status: 400 }
                    );
                }

                requestedEmailChange = normalizedEmail;
            }
        }

        if (Object.keys(dataToUpdate).length === 0 && !requestedEmailChange) {
            const unchangedUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: {
                    id: true,
                    username: true,
                    bio: true,
                    avatar: true,
                    email: true,
                    emailVerified: true,
                    totpEnabled: true,
                },
            });
            return NextResponse.json({ success: true, user: unchangedUser });
        }

        const userSelect = {
            id: true,
            username: true,
            bio: true,
            avatar: true,
            email: true,
            emailVerified: true,
            totpEnabled: true,
        } as const;

        const updated =
            Object.keys(dataToUpdate).length === 0
                ? await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: userSelect,
                })
                : await prisma.user.update({
                    where: { id: session.user.id },
                    data: dataToUpdate,
                    select: userSelect,
                });

        if (!updated) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const deliveryWarnings: string[] = [];

        if (requestedEmailChange) {
            const token = generatePasswordResetToken();
            const tokenHash = hashSecret(token);
            const expiresAt = new Date(
                Date.now() + EMAIL_CHANGE_TOKEN_TTL_MINUTES * 60 * 1000
            );
            const origin =
                process.env.APP_BASE_URL ||
                process.env.NEXTAUTH_URL ||
                new URL(req.url).origin;
            const confirmationLink = `${origin}/api/auth/email-change/confirm?token=${encodeURIComponent(
                token
            )}`;

            await prisma.$transaction([
                prisma.emailChangeToken.deleteMany({
                    where: {
                        userId: updated.id,
                        usedAt: null,
                    },
                }),
                prisma.emailChangeToken.create({
                    data: {
                        userId: updated.id,
                        newEmail: requestedEmailChange,
                        tokenHash,
                        expiresAt,
                    },
                }),
            ]);

            try {
                await sendEmailChangeConfirmationEmail({
                    toEmail: requestedEmailChange,
                    confirmationLink,
                });
            } catch (err) {
                console.error("Email change confirmation delivery failure:", err);
                await prisma.emailChangeToken.deleteMany({
                    where: {
                        userId: updated.id,
                        tokenHash,
                        usedAt: null,
                    },
                });
                deliveryWarnings.push("Could not send confirmation to the new email address.");
            }

            try {
                await sendEmailChangeNotice({
                    toEmail: currentUser.email,
                    requestedEmail: requestedEmailChange,
                });
            } catch (err) {
                console.error("Email change notice delivery failure:", err);
            }
        }

        const payload: Record<string, unknown> = { success: true, user: updated };
        if (requestedEmailChange) {
            payload.pendingEmailChange = requestedEmailChange;
        }
        if (deliveryWarnings.length > 0) {
            payload.deliveryWarnings = deliveryWarnings;
        }

        return NextResponse.json(payload);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { error: "Email is already in use." },
                { status: 400 }
            );
        }

        console.error("Update profile error", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}
