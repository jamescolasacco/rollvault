import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import {
    isValidEmail,
    normalizeEmail,
    normalizeUsername,
    validatePassword,
    validateUsername,
} from "@/lib/account";
import { issueEmailVerificationCode, VerificationCooldownError } from "@/lib/accountSecurity";
import { sendEmailVerificationCode } from "@/lib/notificationDelivery";

export async function POST(req: Request) {
    try {
        const { email, password, username } = await req.json();

        if (!email || !password || !username) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        const normalizedEmail = normalizeEmail(email);
        const normalizedUsername = normalizeUsername(username);

        if (!isValidEmail(normalizedEmail)) {
            return NextResponse.json({ message: "Please enter a valid email address." }, { status: 400 });
        }

        const usernameError = validateUsername(normalizedUsername);
        if (usernameError) {
            return NextResponse.json({ message: usernameError }, { status: 400 });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json({ message: passwordError }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
            },
            select: { email: true, username: true },
        });

        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                return NextResponse.json({ message: "An account with that email already exists." }, { status: 400 });
            }
            return NextResponse.json({ message: "That username is already taken." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: normalizedEmail,
                username: normalizedUsername,
                password: hashedPassword,
            },
        });

        const emailVerification = await issueEmailVerificationCode(user.id);

        const deliveryWarnings: string[] = [];
        await sendEmailVerificationCode({
            toEmail: user.email,
            code: emailVerification.code,
        }).catch((error) => {
            console.error("Email verification send failed:", error);
            deliveryWarnings.push("We could not send the email verification code.");
        });

        const responsePayload: Record<string, unknown> = {
            message: deliveryWarnings.length
                ? "User created, but verification delivery had issues. Use resend in your profile."
                : "User created. Verify your email before uploading images.",
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
            },
        };

        if (deliveryWarnings.length > 0) {
            responsePayload.deliveryWarnings = deliveryWarnings;
        }

        return NextResponse.json(
            responsePayload,
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof VerificationCooldownError) {
            return NextResponse.json({ message: error.message }, { status: 429 });
        }

        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json(
                { message: "Account already exists with that email or username." },
                { status: 400 }
            );
        }

        console.error(error);
        return NextResponse.json({ message: "Error creating user" }, { status: 500 });
    }
}
