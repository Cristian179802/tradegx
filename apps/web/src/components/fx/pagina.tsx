"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

// ── Tranziția de pagină ──────────────────────────────────────────────────────
//
// Steagul `experimental.viewTransition` din Next nu face singur nimic: el doar
// expune `unstable_ViewTransition` din React, care în React 19.1 **nu există**.
// Verificat, nu presupus — de aia nu se vedea nicio tranziție între pagini.
//
// Până când API-ul ajunge stabil, efectul vizibil se obține altfel și mai
// simplu: `key={pathname}` remontează conținutul la fiecare schimbare de rută,
// iar clasa `.tg-pagina` îl animă la intrare. Ecranul nou urcă în loc să apară
// brusc.
//
// De ce nu `document.startViewTransition` peste `router.push`: navigarea în App
// Router aduce date de pe server, iar API-ul îngheață ecranul până se termină
// promisiunea pe care i-o dai. Un ecran înghețat cât ține o cerere de rețea e
// mai rău decât o clipire.

export function Pagina({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={className ? `tg-pagina ${className}` : "tg-pagina"}>
      {children}
    </div>
  );
}
