import * as React from "react";
import { Animated, Easing, StyleSheet, Text, View, type TextStyle } from "react-native";
import { T, cifre } from "../theme";
import { familieCifre } from "../lib/fonturi";

// ── Odometru ─────────────────────────────────────────────────────────────────
//
// Portarea lui `<RollingNumber/>` din web: fiecare cifră e o coloană verticală
// cu 0–9 care se rotește până la valoarea ei. Nu se interpolează VALOAREA
// (1 → 2 → … → 186), se rotesc CIFRELE — diferența dintre „un număr apare pe
// ecran" și „un aparat afișează o măsurătoare".
//
// Primește un string DEJA formatat („+380.31 USD", „35.9%"), fiindcă
// formatarea ține de locale și de monedă, nu de animație. Se animă doar
// caracterele 0–9; separatorii, moneda și semnele stau pe loc.
//
// TOT pe driverul nativ. O listă cu douăzeci de cifre care se rotesc simultan
// ar bloca firul de JavaScript dacă animația ar trece prin el.
//
// Accesibilitate: coloanele sunt ascunse cititorului de ecran, iar valoarea
// reală e expusă o singură dată pe container — altfel s-ar citi toate cele
// zece cifre din fiecare coloană.

const CIFRE = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export interface RollingNumberProps {
  /** Valoarea deja formatată. */
  value: string;
  size?: number;
  color?: string;
  weight?: TextStyle["fontWeight"];
  /** Durata rostogolirii, ms. */
  durata?: number;
  /** Întârziere înainte de start, ms — pentru cascada de la intrarea în ecran. */
  intarziere?: number;
  /** Decalaj între cifre, ms. Dă senzația mecanică, nu de bloc. */
  decalaj?: number;
}

export function RollingNumber({
  value,
  size = T.fontSize.xl,
  color = T.ink.i1,
  weight = "800",
  durata = 900,
  intarziere = 0,
  decalaj = 45,
}: RollingNumberProps) {
  const caractere = React.useMemo(() => Array.from(value), [value]);
  const inaltime = Math.ceil(size * 1.18);

  const totalCifre = caractere.filter((c) => c >= "0" && c <= "9").length;
  let indexCifra = -1;

  return (
    <View
      style={st.rand}
      accessible
      accessibilityLabel={value}
      accessibilityRole="text"
    >
      {caractere.map((ch, i) => {
        const esteCifra = ch >= "0" && ch <= "9";
        if (!esteCifra) {
          return (
            <Text
              key={`${i}-${ch}`}
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[st.text, cifre, { fontSize: size, color, fontFamily: familieCifre(weight), lineHeight: inaltime }]}
            >
              {ch}
            </Text>
          );
        }
        indexCifra++;
        // Dreapta → stânga: unitățile pleacă primele, ca la un contor mecanic.
        const dinDreapta = totalCifre - 1 - indexCifra;
        return (
          <Coloana
            key={`${i}-col`}
            cifra={Number(ch)}
            inaltime={inaltime}
            size={size}
            color={color}
            weight={weight}
            durata={durata}
            intarziere={intarziere + dinDreapta * decalaj}
          />
        );
      })}
    </View>
  );
}

function Coloana({
  cifra, inaltime, size, color, weight, durata, intarziere,
}: {
  cifra: number;
  inaltime: number;
  size: number;
  color: string;
  weight: TextStyle["fontWeight"];
  durata: number;
  intarziere: number;
}) {
  const pozitie = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(pozitie, {
      toValue: -cifra * inaltime,
      duration: durata,
      delay: intarziere,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [cifra, inaltime, durata, intarziere, pozitie]);

  return (
    <View
      style={{ height: inaltime, overflow: "hidden" }}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Animated.View style={{ transform: [{ translateY: pozitie }] }}>
        {CIFRE.map((n) => (
          <Text
            key={n}
            style={[st.text, cifre, { fontSize: size, color, fontFamily: familieCifre(weight), lineHeight: inaltime, height: inaltime }]}
          >
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  rand: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  text: {
    letterSpacing: T.tracking.tight,
    textAlign: "center",
  },
});
