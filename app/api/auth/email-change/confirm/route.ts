import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashSecret } from "@/lib/accountSecurity";

function buildRedirect(req: Request, status: "success" | "invalid" | "expired" | "taken") {
  const url = new URL("/login", req.url);
  url.searchParams.set("emailChange", status);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return buildRedirect(req, "invalid");
    }

    const tokenHash = hashSecret(token);
    const record = await prisma.emailChangeToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        newEmail: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!record || record.usedAt) {
      return buildRedirect(req, "invalid");
    }

    const now = new Date();
    if (record.expiresAt <= now) {
      await prisma.emailChangeToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      });
      return buildRedirect(req, "expired");
    }

    const conflict = await prisma.user.findFirst({
      where: {
        email: record.newEmail,
        id: { not: record.userId },
      },
      select: { id: true },
    });

    if (conflict) {
      await prisma.emailChangeToken.update({
        where: { id: record.id },
        data: { usedAt: now },
      });
      return buildRedirect(req, "taken");
    }

    await prisma.$transaction([
      prisma.emailChangeToken.updateMany({
        where: {
          userId: record.userId,
          usedAt: null,
        },
        data: { usedAt: now },
      }),
      prisma.user.update({
        where: { id: record.userId },
        data: {
          email: record.newEmail,
          emailVerified: true,
        },
      }),
    ]);

    return buildRedirect(req, "success");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return buildRedirect(req, "taken");
    }
    console.error("Email change confirm error", error);
    return buildRedirect(req, "invalid");
  }
}
