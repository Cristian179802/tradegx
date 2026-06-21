"use client";

import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/auth.store";

export function useAuth() {
  const { data: session, status, update } = useSession();
  const { activeAccountId, setActiveAccountId } = useAuthStore();

  return {
    user: session?.user ?? null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isPro: session?.user?.plan === "PRO",
    isTrialing: session?.user?.isTrialing ?? false,
    isAdmin: session?.user?.role === "ADMIN",
    isCoach: session?.user?.role === "COACH",
    activeAccountId,
    setActiveAccountId,
    updateSession: update,
  };
}
