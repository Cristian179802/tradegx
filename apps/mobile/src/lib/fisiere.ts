import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

// ── Fișiere care intră și ies din aplicație ──────────────────────────────────
//
// Trei drumuri, toate prin foile de sistem — niciunul nu cere permisiuni
// declarate în manifest. Alegătorul de poze de pe Android modern (Photo Picker)
// întoarce exact fișierul ales, fără acces la galerie; alegătorul de documente
// la fel. Asta înseamnă că aplicația nu trebuie să ceară „acces la fotografii”,
// iar cine instalează nu vede un dialog care îl sperie.
//
// IMAGINILE PLEACĂ CA base64, nu ca multipart. Ruta serverului așa le așteaptă,
// iar pe o conexiune mobilă un singur corp JSON e mai previzibil decât un
// formular cu graniță. Costul e ~33% mai mulți octeți; de aceea poza e tăiată
// la 1600px și comprimată înainte.

const CALITATE = 0.7;

export type RezultatImagine =
  | { fel: "aleasa"; base64: string; mimeType: string }
  | { fel: "anulat" }
  | { fel: "eroare"; mesaj: string };

/**
 * Deschide alegătorul de poze și întoarce imaginea gata de trimis.
 *
 * `base64: true` o cere de la bun început: citirea ulterioară din fișier ar fi
 * fost un drum în plus prin disc, pentru același rezultat.
 */
export async function alegeImagine(): Promise<RezultatImagine> {
  try {
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: CALITATE,
      base64: true,
      // Tăierea o face omul dacă vrea; o impunere ar strica un grafic lat.
      allowsEditing: false,
    });

    if (r.canceled || !r.assets?.[0]) return { fel: "anulat" };
    const a = r.assets[0];
    if (!a.base64) return { fel: "eroare", mesaj: "Nu am putut citi imaginea." };

    // Serverul acceptă JPEG, PNG și WEBP. Alegătorul dă `image/*` pe unele
    // telefoane, deci ghicim din extensie când nu știm sigur.
    const tip =
      a.mimeType && a.mimeType !== "image/*"
        ? a.mimeType
        : /\.png$/i.test(a.uri) ? "image/png"
        : /\.webp$/i.test(a.uri) ? "image/webp"
        : "image/jpeg";

    return { fel: "aleasa", base64: a.base64, mimeType: tip };
  } catch (e) {
    return { fel: "eroare", mesaj: e instanceof Error ? e.message : "Alegătorul nu s-a deschis." };
  }
}

export type RezultatFisier =
  | { fel: "ales"; continut: string; nume: string }
  | { fel: "anulat" }
  | { fel: "eroare"; mesaj: string };

/** Deschide alegătorul de documente pentru un CSV sau un raport HTML de broker. */
export async function alegeFisierText(): Promise<RezultatFisier> {
  try {
    const r = await DocumentPicker.getDocumentAsync({
      type: ["text/csv", "text/comma-separated-values", "text/html", "text/plain", "*/*"],
      copyToCacheDirectory: true,
    });

    if (r.canceled || !r.assets?.[0]) return { fel: "anulat" };
    const a = r.assets[0];
    const continut = await FileSystem.readAsStringAsync(a.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (!continut.trim()) return { fel: "eroare", mesaj: "Fișierul e gol." };
    return { fel: "ales", continut, nume: a.name ?? "fisier" };
  } catch (e) {
    return { fel: "eroare", mesaj: e instanceof Error ? e.message : "Nu am putut citi fișierul." };
  }
}

/**
 * Scrie un text într-un fișier și deschide foaia de partajare.
 *
 * Fără partajare, fișierul ar rămâne într-un dosar al aplicației pe care nimeni
 * nu-l deschide — adică un export care nu exportă nimic.
 */
export async function trimiteText(
  continut: string,
  numeFisier: string,
  mimeType = "text/csv",
): Promise<{ fel: "partajat" } | { fel: "salvat"; cale: string } | { fel: "eroare"; mesaj: string }> {
  try {
    const cale = `${FileSystem.cacheDirectory}${numeFisier}`;
    await FileSystem.writeAsStringAsync(cale, continut, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(cale, { mimeType, dialogTitle: numeFisier });
      return { fel: "partajat" };
    }
    return { fel: "salvat", cale };
  } catch (e) {
    return { fel: "eroare", mesaj: e instanceof Error ? e.message : "Nu am putut scrie fișierul." };
  }
}

/**
 * Construiește un CSV dintr-o listă de obiecte.
 *
 * Virgulele, ghilimelele și rândurile noi din valori se escapează după RFC 4180
 * — altfel o notă care conține o virgulă rupe toate coloanele de după ea, iar
 * fișierul se deschide strâmb în Excel fără ca nimeni să vadă de ce.
 */
export function faCsv(capete: string[], randuri: (string | number | null)[][]): string {
  const celula = (v: string | number | null): string => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [capete.map(celula).join(","), ...randuri.map((r) => r.map(celula).join(","))].join("\r\n");
}
