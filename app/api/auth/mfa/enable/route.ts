import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
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

    const { code } = await req.json();
    if (typeof code !== "string") {
      return NextResponse.json({ message: "A valid authenticator code is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        totpEnabled: true,
        totpPendingSecret: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (user.totpEnabled) {
      return NextResponse.json({ message: "Authenticator app is already enabled." }, { status: 400 });
    }

    if (!user.totpPendingSecret) {
      return NextResponse.json(
        { message: "Start setup first before enabling authenticator app." },
        { status: 400 }
      );
    }

    const valid = verifyTotpCode({
      secret: user.totpPendingSecret,
      code,
    });

    if (!valid) {
      return NextResponse.json({ message: "Invalid authenticator code." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        totpEnabled: true,
        totpSecret: user.totpPendingSecret,
        totpPendingSecret: null,
      },
    });

    return NextResponse.json({ message: "Authenticator app enabled successfully." });
  } catch (error) {
    console.error("MFA enable error", error);
    return NextResponse.json({ message: "Could not enable authenticator app." }, { status: 500 });
  }
}
