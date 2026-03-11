import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTotpOtpauthUrl, generateTotpSecret } from "@/lib/totp";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!session.user.emailVerified) {
      return NextResponse.json({ message: "Email verification required." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        totpEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json({ message: "Authenticator app is already enabled." }, { status: 400 });
    }

    const secret = generateTotpSecret();
    const otpauthUrl = buildTotpOtpauthUrl({
      accountName: user.email,
      secret,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { totpPendingSecret: secret },
    });

    return NextResponse.json({
      message: "Authenticator setup key generated.",
      secret,
      otpauthUrl,
    });
  } catch (error) {
    console.error("MFA setup error", error);
    return NextResponse.json({ message: "Could not initialize authenticator setup." }, { status: 500 });
  }
}
