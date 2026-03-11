import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      emailVerified: boolean;
      mfaEnabled: boolean;
    };
  }

  interface User {
    emailVerified?: boolean;
    mfaEnabled?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    name?: string | null;
    emailVerified?: boolean;
    mfaEnabled?: boolean;
  }
}
