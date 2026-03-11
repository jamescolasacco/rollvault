import { prisma } from "./prisma";

export const UNVERIFIED_ACCOUNT_GRACE_HOURS = 24;

export function getUnverifiedAccountExpiryCutoff(now = new Date()): Date {
  return new Date(
    now.getTime() - UNVERIFIED_ACCOUNT_GRACE_HOURS * 60 * 60 * 1000
  );
}

export async function pruneExpiredUnverifiedAccounts(now = new Date()) {
  const cutoff = getUnverifiedAccountExpiryCutoff(now);
  const result = await prisma.user.deleteMany({
    where: {
      emailVerified: false,
      createdAt: { lt: cutoff },
    },
  });

  return {
    deletedCount: result.count,
    cutoff,
  };
}
