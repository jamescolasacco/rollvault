import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyTotpCode } from "@/lib/totp";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.emailVerified) {
      return NextResponse.json({ message: "Email verification required." }, { status: 403 });
    }

    const { password, code } = await req.json();
    if (typeof password !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { message: "Password and current authenticator code are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        password: true,
        totpEnabled: true,
        totpSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (!user.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ message: "Authenticator app is not enabled." }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ message: "Incorrect password." }, { status: 400 });
    }

    const validCode = verifyTotpCode({
      secret: user.totpSecret,
      code,
    });
    if (!validCode) {
      return NextResponse.json({ message: "Invalid authenticator code." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
        totpPendingSecret: null,
      },
    });

    return NextResponse.json({ message: "Authenticator app disabled." });
  } catch (error) {
    console.error("MFA disable error", error);
    return NextResponse.json({ message: "Could not disable authenticator app." }, { status: 500 });
  }
}
