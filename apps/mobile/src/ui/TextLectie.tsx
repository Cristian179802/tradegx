import * as React from "react";
import { StyleSheet, View, type TextStyle } from "react-native";
import { Text } from "./Text";
import { T } from "../theme";

// ── Textul unei lecții ───────────────────────────────────────────────────────
//
// Lecțiile sunt scrise cu un mini-markdown: paragrafe separate de linie goală,
// `**îngroșat**`, `` `cod` ``, liste cu „- ” și „1. ”, și termeni de glosar
// scriși `[[slug]]` sau `[[slug|text afișat]]`.
//
// DE CE NU O BIBLIOTECĂ DE MARKDOWN: ar fi adus un parser întreg pentru patru
// reguli, și ar fi randat și ce nu vrem (imagini, tabele HTML, linkuri
// arbitrare dintr-un text pe care îl scriem noi, dar care trece printr-o rută).
// Patru reguli se citesc mai repede decât configurarea unei biblioteci.
//
// Termenii de glosar se desenează colorat și SUBLINIAT PUNCTAT, nu ca linkuri
// albastre: pe telefon nu există tooltip, deci apăsarea deschide definiția în
// glosar. Sublinierea punctată spune „e explicabil”, nu „te duce altundeva”.

export interface TextLectieProps {
  text: string;
  /** Apăsare pe un termen de glosar. Fără ea, termenii rămân doar evidențiați. */
  onTermen?: (slug: string) => void;
  style?: TextStyle;
}

export function TextLectie({ text, onTermen, style }: TextLectieProps) {
  const blocuri = React.useMemo(() => imparte(text), [text]);

  return (
    <View>
      {blocuri.map((b, i) => {
        if (b.fel === "lista") {
          return (
            <View key={i} style={st.lista}>
              {b.elemente.map((el, j) => (
                <View key={j} style={st.elementLista}>
                  <Text style={st.marcaj}>{b.numerotata ? `${j + 1}.` : "•"}</Text>
                  <Text style={[st.paragraf, style, { flex: 1, marginTop: 0 }]}>
                    <Inline text={el} onTermen={onTermen} />
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} style={[st.paragraf, style, i === 0 && { marginTop: 0 }]}>
            <Inline text={b.text} onTermen={onTermen} />
          </Text>
        );
      })}
    </View>
  );
}

/* ── Inline: bold, cod, termeni ───────────────────────────────────────────── */

function Inline({ text, onTermen }: { text: string; onTermen?: (slug: string) => void }) {
  const bucati = React.useMemo(() => taie(text), [text]);

  return (
    <>
      {bucati.map((b, i) => {
        if (b.fel === "bold") return <Text key={i} style={st.bold}>{b.text}</Text>;
        if (b.fel === "cod") return <Text key={i} style={st.cod}>{b.text}</Text>;
        if (b.fel === "termen") {
          return (
            <Text
              key={i}
              style={st.termen}
              onPress={onTermen ? () => onTermen(b.slug) : undefined}
              suppressHighlighting
            >
              {b.text}
            </Text>
          );
        }
        return <Text key={i}>{b.text}</Text>;
      })}
    </>
  );
}

/* ── Împărțirea în blocuri ────────────────────────────────────────────────── */

type Bloc =
  | { fel: "paragraf"; text: string }
  | { fel: "lista"; numerotata: boolean; elemente: string[] };

function imparte(text: string): Bloc[] {
  const linii = text.split("\n");
  const blocuri: Bloc[] = [];
  let paragraf: string[] = [];
  let lista: string[] = [];
  let numerotata = false;

  const inchideParagraf = () => {
    if (paragraf.length === 0) return;
    blocuri.push({ fel: "paragraf", text: paragraf.join(" ").trim() });
    paragraf = [];
  };
  const inchideLista = () => {
    if (lista.length === 0) return;
    blocuri.push({ fel: "lista", numerotata, elemente: lista });
    lista = [];
  };

  for (const l of linii) {
    const t = l.trim();
    if (t === "") { inchideParagraf(); inchideLista(); continue; }

    const bulina = /^- (.*)$/.exec(t);
    const numar = /^\d+\.\s+(.*)$/.exec(t);

    if (bulina) {
      inchideParagraf();
      if (lista.length > 0 && numerotata) inchideLista();
      numerotata = false;
      lista.push(bulina[1] ?? "");
      continue;
    }
    if (numar) {
      inchideParagraf();
      if (lista.length > 0 && !numerotata) inchideLista();
      numerotata = true;
      lista.push(numar[1] ?? "");
      continue;
    }

    inchideLista();
    paragraf.push(t);
  }

  inchideParagraf();
  inchideLista();
  return blocuri;
}

/* ── Tăierea inline ───────────────────────────────────────────────────────── */

type Bucata =
  | { fel: "text"; text: string }
  | { fel: "bold"; text: string }
  | { fel: "cod"; text: string }
  | { fel: "termen"; text: string; slug: string };

// O singură trecere, cu un tipar care prinde toate cele trei forme. Trei treceri
// separate ar fi însemnat că un `**text**` dintr-un `[[...]]` se procesează de
// două ori, în ordinea greșită.
const TIPAR = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\*\*([^*]+)\*\*|`([^`]+)`/g;

function taie(text: string): Bucata[] {
  const bucati: Bucata[] = [];
  let ultim = 0;
  let m: RegExpExecArray | null;

  TIPAR.lastIndex = 0;
  while ((m = TIPAR.exec(text)) !== null) {
    if (m.index > ultim) bucati.push({ fel: "text", text: text.slice(ultim, m.index) });

    if (m[1] != null) {
      const slug = m[1].trim();
      bucati.push({ fel: "termen", text: (m[2] ?? m[1]).trim(), slug });
    } else if (m[3] != null) {
      bucati.push({ fel: "bold", text: m[3] });
    } else if (m[4] != null) {
      bucati.push({ fel: "cod", text: m[4] });
    }
    ultim = m.index + m[0].length;
  }

  if (ultim < text.length) bucati.push({ fel: "text", text: text.slice(ultim) });
  return bucati;
}

const st = StyleSheet.create({
  paragraf: {
    color: T.ink.i2,
    fontSize: T.fontSize.sm,
    fontFamily: "Inter_400Regular",
    lineHeight: 23,
    marginTop: T.spacing.md,
  },
  bold: {
    color: T.ink.i1,
    fontFamily: "Inter_700Bold",
  },
  cod: {
    color: T.accent.base,
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: T.fontSize.xs,
  },
  termen: {
    color: T.accent.base,
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },
  lista: { marginTop: T.spacing.md, gap: 6 },
  elementLista: { flexDirection: "row", gap: T.spacing.sm },
  marcaj: {
    color: T.ink.i4,
    fontSize: T.fontSize.sm,
    fontFamily: "SpaceGrotesk_500Medium",
    lineHeight: 23,
    minWidth: 16,
  },
});
