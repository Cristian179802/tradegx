import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  activeAccountId: string | null;
  sidebarCollapsed: boolean;
  setActiveAccountId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      activeAccountId: null,
      sidebarCollapsed: false,
      setActiveAccountId: (id) => set({ activeAccountId: id }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: "TradeGX-auth-store",
      partialize: (state) => ({
        activeAccountId: state.activeAccountId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
