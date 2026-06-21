import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthStore {
  activeAccountId: string | null;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  setActiveAccountId: (id: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      activeAccountId: null,
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      setActiveAccountId: (id) => set({ activeAccountId: id }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleMobileSidebar: () =>
        set({ mobileSidebarOpen: !get().mobileSidebarOpen }),
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
