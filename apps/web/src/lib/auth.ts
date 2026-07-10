import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken, decryptSecret, verifyBackup } from "@/lib/twofactor";
import type { Role, SubscriptionPlan } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: Role;
      plan: SubscriptionPlan;
      isTrialing: boolean;
      /** ms epoch — sfârșitul trial-ului (pentru countdown în UI) */
      trialEndsAt: number | null;
    };
  }
  interface JWT {
    id: string;
    role: Role;
    plan: SubscriptionPlan;
    isTrialing: boolean;
    trialEndsAt: number | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { subscription: true },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;

        // ── Gate 2FA (doar dacă utilizatorul l-a activat) ──
        if (user.totpEnabled && user.totpSecret) {
          const code = ((credentials.code as string) || "").trim();
          if (!code) return null; // clientul cere codul via pre-check
          let ok = false;
          if (/^\d{6}$/.test(code)) {
            try { ok = verifyToken(code, decryptSecret(user.totpSecret)); } catch { ok = false; }
          }
          if (!ok) {
            const res = verifyBackup(code, user.totpBackupCodes);
            if (res.ok) {
              await prisma.user.update({ where: { id: user.id }, data: { totpBackupCodes: res.remaining } });
              ok = true;
            }
          }
          if (!ok) return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.subscription?.plan ?? "FREE",
          isTrialing: user.subscription?.status === "TRIALING",
          trialEndsAt:
            user.subscription?.status === "TRIALING" && user.subscription.trialEnd
              ? user.subscription.trialEnd.getTime()
              : null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
        token.plan = (user as { plan: SubscriptionPlan }).plan;
        token.isTrialing = (user as { isTrialing: boolean }).isTrialing;
        token.trialEndsAt = (user as { trialEndsAt: number | null }).trialEndsAt ?? null;
      }

      if (trigger === "update" && session) {
        token.plan = session.plan;
        token.isTrialing = session.isTrialing;
        if ("trialEndsAt" in session) token.trialEndsAt = session.trialEndsAt;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;

        // Planul EFECTIV, calculat la fiecare cerere de sesiune:
        // trial valid → PRO; trial expirat → FREE (fără re-login).
        const trialEndsAt = (token.trialEndsAt as number | null) ?? null;
        const paidPro = (token.plan as SubscriptionPlan) === "PRO";
        const trialActive =
          !paidPro && trialEndsAt !== null && Date.now() < trialEndsAt;

        session.user.plan = paidPro || trialActive ? "PRO" : "FREE";
        session.user.isTrialing = trialActive;
        session.user.trialEndsAt = trialActive ? trialEndsAt : null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth sign-ins, bootstrap subscription + default account
      if (account?.provider !== "credentials") {
        await bootstrapNewUser(user.id as string);
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      await bootstrapNewUser(user.id!);
    },
  },
});

async function bootstrapNewUser(userId: string): Promise<void> {
  if (!userId) return;

  const existingSub = await prisma.subscription.findUnique({
    where: { userId },
  });
  if (existingSub) return;

  const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.subscription.create({
      data: {
        userId,
        plan: "FREE",
        status: "TRIALING",
        trialEnd,
      },
    }),
    prisma.tradingAccount.create({
      data: {
        userId,
        name: "Cont Demo",
        type: "DEMO",
        currency: "USD",
        balance: 10000,
        initialBalance: 10000,
        leverage: 100,
      },
    }),
  ]);
}
