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

export function Text({ children, ...rest }: TextProps) {
  const t = useT();

  const tradus = React.useMemo(() => {
    if (typeof children === "string") return t(children);
    if (Array.isArray(children)) {
      return children.map((c) => (typeof c === "string" ? t(c) : c));
    }
    return children;
  }, [children, t]);

  return <TextRN {...rest}>{tradus}</TextRN>;
}
