import type { Db, User } from "@unveiled/db";

export type UserRole = User["role"];

export type AuthOptions = {
  db: Db;
  authUrl: string;
};

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  partnerId: string | null;
  credits: number;
  onboardingComplete: boolean;
};

export type AppSession = {
  user: SessionUser;
};

export type NeonAuthUser = {
  id: string;
  email: string;
  emailVerified?: boolean;
  name?: string | null;
  image?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type ProvisionProfile = {
  firstName?: string | null;
  lastName?: string | null;
};

declare module "hono" {
  interface ContextVariableMap {
    session: AppSession | null;
  }
}
