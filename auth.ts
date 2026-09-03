import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Apple from "next-auth/providers/apple";
import Vk from "next-auth/providers/vk";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/app/lib/drizzle";
import {
  authUsers,
  authAccounts,
  authSessions,
  authVerificationTokens,
} from "@/app/lib/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: authUsers,
    accountsTable: authAccounts,
    sessionsTable: authSessions,
    verificationTokensTable: authVerificationTokens,
  }),
  providers: [
    Google,
    GitHub,
    Apple,
    Vk({
      clientId: process.env.VK_CLIENT_ID,
      clientSecret: process.env.VK_CLIENT_SECRET,
    }),
  ],
});
