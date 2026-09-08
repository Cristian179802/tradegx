// ── Ce NU merită înregistrat din browser ─────────────────────────────────────
//
// Browserele și extensiile produc erori care nu sunt ale noastre. Fără filtru,
// panoul s-ar umple de zgomot și defectele reale s-ar pierde printre ele — adică
// exact problema pe care monitorizarea trebuia s-o rezolve.
//
// Filtrul rulează pe SERVER, nu în client: unul din client poate fi ocolit, și
// oricum n-am vrea să depindem de el.
//
// Fișier separat ca să fie testabil. Ruta care îl folosește nu se poate importa
// într-un test — lecție învățată la amprenta erorilor, unde testul își copiase
// logica și copia a rămas în urmă de original.

/**
 * Tipare care nu indică niciun defect al nostru.
 *
 * Fiecare intrare are un motiv, nu e o listă strânsă din obișnuință.
 */
export const TIPARE_ZGOMOT: { tipar: RegExp; motiv: string }[] = [
  {
    tipar: /ResizeObserver loop/i,
    motiv: "Zgomot de browser, benign și foarte frecvent. Nu strică nimic pentru utilizator.",
  },
  {
    tipar: /^Script error\.?$/i,
    motiv:
      "Eroare dintr-un script de pe alt domeniu: browserul nu ne dă niciun detaliu, " +
      "deci rândul ar fi literalmente „Script error.\" și atât.",
  },
  {
    tipar: /chrome-extension:\/\/|moz-extension:\/\/|safari-web-extension:\/\//i,
    motiv: "Extensiile utilizatorului. Ale lui, nu ale noastre — și nu le putem repara.",
  },
  {
    tipar: /Load failed|NetworkError when attempting to fetch|Failed to fetch/i,
    motiv:
      "Navigare întreruptă sau conexiune pierdută — de obicei utilizatorul a închis " +
      "tabul în mijlocul unei cereri. Nu e un defect de cod.",
  },
];

/** true dacă textul e zgomot care nu merită înregistrat. */
export function esteZgomotDeBrowser(text: string): boolean {
  if (!text) return false;
  return TIPARE_ZGOMOT.some(({ tipar }) => tipar.test(text));
}
