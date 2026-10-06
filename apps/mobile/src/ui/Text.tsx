import * as React from "react";
import { Text as TextRN, type TextProps } from "react-native";
import { useT } from "../lib/i18n";

// ── Text care se traduce singur ──────────────────────────────────────────────
//
// DE CE AȘA, și nu `t("...")` scris de mână la fiecare text. Aplicația are 733
// de texte în 59 de fișiere. Scrise de mână, ar fi însemnat 733 de ocazii de a
// uita unul — iar un text uitat nu se vede niciodată la testare în română,
// fiindcă în română arată corect. Se vede abia la un utilizator englez, care nu
// ne spune, ci dezinstalează.
//
// Așa, orice text pus într-un `<Text>` e tradus din start, inclusiv în ecranele
// scrise de-acum înainte. Nu se poate uita, fiindcă nu e nimic de ținut minte.
//
// TRADUCE DOAR ȘIRURI, nu și cifre sau elemente. `{sold}` rămâne `{sold}`,
// `{numar(x)}` la fel. Traducem doar ce e scris literal în cod, adică exact ce
// a scris un om și trebuie citit de alt om.
//
// Copiii amestecați (`Text {variabila} text`) se traduc bucată cu bucată — ceea
// ce e corect pentru „Mai ai {n} zile", unde bucățile au sens de sine stătător,
// dar NU pentru fraze unde engleza cere altă ordine a cuvintelor. Acolo se
// scrie tot textul dintr-o bucată, cu un șablon: vezi `umple()` din `format`.
//
// SPAȚIILE DE LA MARGINI NU FAC PARTE DIN CHEIE. Din `Mai ai {n} zile`, JSX
// face bucățile „Mai ai " și „ zile" — cu spațiul lipit de cuvânt. Căutate
// așa, n-ar găsi niciodată cheia „Mai ai": bucata ar rămâne în română, deși
// traducerea există și poarta raportează verde. Traducem miezul și punem
// spațiile la loc, ca valoarea dintre ele să nu se lipească de cuvinte.
//
// CONȚINUTUL SCRIS DE OM NU SE TRADUCE. Traducerea caută textul întreg ca cheie
// în dicționar — iar dicționarul are sute de chei scurte („Bună ziua", „Real",
// „Lacom", „Sold"). Un mesaj către asistent, numele unui cont, o notă de jurnal
// sau o postare care se nimeresc identice cu o cheie ar fi apărut schimbate:
// omul scrie „Bună ziua" și își vede propriul mesaj ca „Good afternoon".
// Pentru text care vine de la utilizator se pune `netradus`.

function traduceBucata(t: (ro: string) => string, s: string): string {
  const inceput = s.length - s.trimStart().length;
  const sfarsit = s.trimEnd().length;
  if (sfarsit <= inceput) return s; // doar spații
  return s.slice(0, inceput) + t(s.slice(inceput, sfarsit)) + s.slice(sfarsit);
}

export function Text({ children, netradus = false, ...rest }: TextProps & { netradus?: boolean }) {
  const t = useT();

  const tradus = React.useMemo(() => {
    if (netradus) return children;
    if (typeof children === "string") return traduceBucata(t, children);
    if (Array.isArray(children)) {
      return children.map((c) => (typeof c === "string" ? traduceBucata(t, c) : c));
    }
    return children;
  }, [children, t, netradus]);

  return <TextRN {...rest}>{tradus}</TextRN>;
}
