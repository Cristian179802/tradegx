import type { Ionicons } from "@expo/vector-icons";

// ── Meniul ───────────────────────────────────────────────────────────────────
//
// Oglindește domeniile din șina de comandă a site-ului (`command-rail.tsx`),
// comprimate de la șase la cinci: educația și comunitatea intră la „Mai mult",
// unde stă oricum contul. Ordinea din fiecare bulă e a site-ului, ca cineva
// care folosește ambele să nu caute de două ori.
//
// `nativ` = ecran în aplicație. Restul deschid pagina reală în browser, ca în
// Setări. Nu pretindem că avem 54 de ecrane native: o săgeată spune sincer că
// ieși din aplicație.
//
// De ce nu am portat tot: pe telefon contează ce faci în treizeci de secunde.
// Backtesting și Academia sunt muncă de birou; a le face native ar însemna
// două locuri de întreținut pentru ceva ce nimeni nu deschide în tramvai.

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
    grupuri: [
      {
        elemente: [
          { eticheta: "Adaugă tranzacție", iconita: "add-circle", tinta: "/(tabs)/adauga", nativ: true },
          { eticheta: "Tranzacții", iconita: "list", tinta: "/(tabs)/tranzactii", nativ: true },
        ],
      },
      {
        titlu: "Pe web",
        elemente: [
          { eticheta: "Jurnal detaliat", iconita: "create-outline", tinta: "/journal" },
          { eticheta: "Checklist", iconita: "checkbox-outline", tinta: "/checklist" },
          { eticheta: "Conturi de trading", iconita: "wallet-outline", tinta: "/accounts" },
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
          { eticheta: "Analytics", iconita: "bar-chart-outline", tinta: "/analytics" },
          { eticheta: "Edge Finder", iconita: "locate-outline", tinta: "/edge" },
          { eticheta: "Monte Carlo", iconita: "dice-outline", tinta: "/monte-carlo" },
          { eticheta: "Backtesting", iconita: "flask-outline", tinta: "/backtesting" },
          { eticheta: "Instituțional", iconita: "business-outline", tinta: "/institutional", insigna: "PRO" },
        ],
      },
      {
        titlu: "Risc",
        elemente: [
          { eticheta: "Manager de risc", iconita: "shield-checkmark-outline", tinta: "/risk-manager" },
          { eticheta: "Calculator lot", iconita: "calculator-outline", tinta: "/calculator" },
          { eticheta: "Obiective", iconita: "trophy-outline", tinta: "/goals" },
          { eticheta: "Prop firm", iconita: "ribbon-outline", tinta: "/prop-firm" },
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
        titlu: "Cont",
        elemente: [
          { eticheta: "Abonament", iconita: "card-outline", tinta: "/billing" },
          { eticheta: "Toate setările", iconita: "options-outline", tinta: "/settings" },
        ],
      },
    ],
  },
];
