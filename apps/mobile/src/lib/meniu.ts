import type { Ionicons } from "@expo/vector-icons";

// ── Meniul ───────────────────────────────────────────────────────────────────
//
// Oglindește domeniile din șina de comandă a site-ului (`command-rail.tsx`),
// comprimate de la șase la cinci: educația și comunitatea intră la „Mai mult",
// unde stă oricum contul. Ordinea din fiecare bulă e a site-ului, ca cineva
// care folosește ambele să nu caute de două ori.
//
// ȚINTA E CA TOTUL SĂ FIE NATIV, în afară de două. Prima versiune trimitea în
// browser tot ce nu era portat, cu o săgeată care spunea sincer că ieși din
// aplicație. Era onest, dar nu era o aplicație — era un meniu de linkuri.
// Ecranele se scriu pe grupuri; cât timp unul lipsește, elementul lui duce la
// pagina REALĂ de pe site, nu la o rută care încă nu există.
//
// Cele două excepții sunt deliberate:
//   · Abonament — plata trece prin Stripe Checkout. Un formular de card
//     reconstruit în aplicație ar însemna date de card prin codul nostru și
//     regulile magazinelor de aplicații pe cap. Browserul e locul corect.
//   · Roadmap — o pagină de prezentare care se schimbă săptămânal. Copiată
//     nativ, ar rămâne în urmă fără ca cineva să observe.
//
// `nativ` = ecran în aplicație. Fără el, elementul deschide browserul și are
// săgeata de ieșire.

export type NumeIconita = React.ComponentProps<typeof Ionicons>["name"];

export interface ElementMeniu {
  eticheta: string;
  iconita: NumeIconita;
  /** Rută internă (începe cu „/") sau cale web. */
  tinta: string;
  /** Ecran în aplicație; altfel se deschide browserul. */
  nativ?: boolean;
  insigna?: string;
}

export interface GrupMeniu {
  titlu?: string;
  elemente: ElementMeniu[];
}

export interface Domeniu {
  id: string;
  eticheta: string;
  iconita: NumeIconita;
  iconitaPlina: NumeIconita;
  /** Ruta deschisă la apăsare, dacă domeniul nu are bulă. */
  ruta?: string;
  /** Rute care aprind butonul fără să fie în listă (ecrane de detaliu). */
  potriviri?: string[];
  grupuri?: GrupMeniu[];
}

export const DOMENII: Domeniu[] = [
  {
    id: "acasa",
    eticheta: "Acasă",
    iconita: "home-outline",
    iconitaPlina: "home",
    // Fără bulă: acasă e o destinație, nu o categorie. Un meniu care se
    // deschide când vrei doar să te întorci acasă e o atingere în plus de
    // fiecare dată.
    ruta: "/(tabs)",
  },
  {
    id: "jurnal",
    eticheta: "Jurnal",
    iconita: "book-outline",
    iconitaPlina: "book",
    potriviri: ["/tranzactie"],
    grupuri: [
      {
        elemente: [
          { eticheta: "Adaugă tranzacție", iconita: "add-circle", tinta: "/(tabs)/adauga", nativ: true },
          { eticheta: "Tranzacții", iconita: "list", tinta: "/(tabs)/tranzactii", nativ: true },
          { eticheta: "Jurnal detaliat", iconita: "create-outline", tinta: "/jurnal", nativ: true },
          { eticheta: "Checklist", iconita: "checkbox-outline", tinta: "/checklist", nativ: true },
          { eticheta: "Conturi de trading", iconita: "wallet-outline", tinta: "/conturi", nativ: true },
        ],
      },
    ],
  },
  {
    id: "analiza",
    eticheta: "Analiză",
    iconita: "stats-chart-outline",
    iconitaPlina: "stats-chart",
    grupuri: [
      {
        titlu: "Performanță",
        elemente: [
          { eticheta: "Analytics", iconita: "bar-chart-outline", tinta: "/analitice", nativ: true },
          { eticheta: "Edge Finder", iconita: "locate-outline", tinta: "/edge", nativ: true },
          { eticheta: "Monte Carlo", iconita: "dice-outline", tinta: "/monte-carlo", nativ: true },
          { eticheta: "Backtesting", iconita: "flask-outline", tinta: "/backtesting", nativ: true },
          { eticheta: "Instituțional", iconita: "business-outline", tinta: "/institutional", nativ: true, insigna: "PRO" },
        ],
      },
      {
        titlu: "Risc",
        elemente: [
          { eticheta: "Manager de risc", iconita: "shield-checkmark-outline", tinta: "/risc", nativ: true },
          { eticheta: "Calculator lot", iconita: "calculator-outline", tinta: "/calculator", nativ: true },
          { eticheta: "Obiective", iconita: "trophy-outline", tinta: "/obiective", nativ: true },
          { eticheta: "Prop firm", iconita: "ribbon-outline", tinta: "/prop-firm", nativ: true },
        ],
      },
    ],
  },
  {
    id: "piete",
    eticheta: "Piețe",
    iconita: "pulse-outline",
    iconitaPlina: "pulse",
    grupuri: [
      {
        titlu: "AI",
        elemente: [
          { eticheta: "Semnale", iconita: "flash-outline", tinta: "/signals" },
          { eticheta: "Asistent AI", iconita: "sparkles-outline", tinta: "/ai-assistant" },
          { eticheta: "Alerte", iconita: "notifications-outline", tinta: "/alerts" },
        ],
      },
      {
        titlu: "Piață",
        elemente: [
          { eticheta: "Grafice", iconita: "trending-up-outline", tinta: "/charts" },
          { eticheta: "Piața azi", iconita: "globe-outline", tinta: "/market" },
          { eticheta: "Calendar economic", iconita: "calendar-outline", tinta: "/calendar" },
          { eticheta: "Știri", iconita: "newspaper-outline", tinta: "/news" },
          { eticheta: "Unelte", iconita: "construct-outline", tinta: "/tools" },
        ],
      },
    ],
  },
  {
    id: "maimult",
    eticheta: "Mai mult",
    iconita: "grid-outline",
    iconitaPlina: "grid",
    grupuri: [
      {
        elemente: [
          { eticheta: "Setări", iconita: "settings", tinta: "/(tabs)/setari", nativ: true },
        ],
      },
      {
        titlu: "Învățare",
        elemente: [
          { eticheta: "Academia", iconita: "school-outline", tinta: "/academy" },
          { eticheta: "Realizări", iconita: "medal-outline", tinta: "/achievements" },
          { eticheta: "Comunitate", iconita: "people-outline", tinta: "/community" },
        ],
      },
      {
        titlu: "Pe web",
        elemente: [
          { eticheta: "Abonament", iconita: "card-outline", tinta: "/billing" },
          { eticheta: "Roadmap", iconita: "map-outline", tinta: "/roadmap" },
        ],
      },
    ],
  },
];
