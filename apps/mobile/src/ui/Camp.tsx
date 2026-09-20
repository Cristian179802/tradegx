import * as React from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { T, ATINGERE_MIN, cifre } from "../theme";

// ── Câmp de introducere ──────────────────────────────────────────────────────
//
// Marginea se aprinde la focalizare — singurul semnal că tastatura scrie AICI.
// Pe un ecran cu șase câmpuri, fără el nu se vede unde ești.
//
// EROAREA STĂ SUB CÂMP, nu într-un dialog. Un dialog te scoate din context și
// te obligă să ții minte ce era greșit; textul roșu sub câmp arată exact unde.
// Iar înălțimea e rezervată mereu, chiar când nu e eroare: altfel formularul
// sare în sus și în jos pe măsură ce validezi.

export interface CampProps {
  eticheta: string;
  valoare: string;
  onChange: (v: string) => void;
  placeholder?: string;
  eroare?: string | null;
  secret?: boolean;
  tastatura?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  /** Cifre tabulare + aliniere la dreapta, pentru sume. */
  numeric?: boolean;
  sufix?: string;
  style?: StyleProp<ViewStyle>;
  onSubmit?: () => void;
  returnKeyType?: "done" | "next" | "go";
  autoFocus?: boolean;
}

export function Camp({
  eticheta,
  valoare,
  onChange,
  placeholder,
  eroare,
  secret = false,
  tastatura,
  autoCapitalize = "none",
  numeric = false,
  sufix,
  style,
  onSubmit,
  returnKeyType,
  autoFocus,
}: CampProps) {
  const [focalizat, setFocalizat] = React.useState(false);
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(p, {
      toValue: focalizat ? 1 : 0,
      duration: T.duration.fast,
      // Culoarea marginii nu poate merge pe driverul nativ.
      useNativeDriver: false,
    }).start();
  }, [focalizat, p]);

  const culoareMargine = eroare
    ? T.pnl.loss
    : (p.interpolate({
        inputRange: [0, 1],
        outputRange: [T.line.l1, T.accent.base],
      }) as unknown as string);

  return (
    <View style={style}>
      <Text style={st.eticheta}>{eticheta}</Text>
      <Animated.View style={[st.cutie, { borderColor: culoareMargine }]}>
        <TextInput
          value={valoare}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={T.ink.i4}
          secureTextEntry={secret}
          keyboardType={tastatura ?? (numeric ? "decimal-pad" : "default")}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          onFocus={() => setFocalizat(true)}
          onBlur={() => setFocalizat(false)}
          onSubmitEditing={onSubmit}
          returnKeyType={returnKeyType}
          autoFocus={autoFocus}
          selectionColor={T.accent.base}
          style={[st.input, numeric && st.numeric, numeric && cifre]}
        />
        {sufix ? <Text style={st.sufix}>{sufix}</Text> : null}
      </Animated.View>
      {/* Înălțime rezervată — formularul nu sare la validare. */}
      <Text style={st.eroare} numberOfLines={1}>
        {eroare ?? " "}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  eticheta: {
    fontSize: T.fontSize.xs,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    color: T.ink.i4,
    textTransform: "uppercase",
    letterSpacing: T.tracking.wider,
    marginBottom: 6,
  },
  cutie: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: ATINGERE_MIN,
    backgroundColor: T.surface.s4,
    borderRadius: T.radius.md,
    borderWidth: 1,
    paddingHorizontal: T.spacing.md,
  },
  input: {
    flex: 1,
    color: T.ink.i1,
    fontSize: T.fontSize.base,
    fontFamily: "Inter_400Regular",
    paddingVertical: T.spacing.md,
  },
  numeric: {
    textAlign: "right",
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  sufix: {
    color: T.ink.i3,
    fontSize: T.fontSize.sm,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginLeft: T.spacing.sm,
  },
  eroare: {
    fontSize: T.fontSize.xs,
    fontFamily: "Inter_400Regular",
    color: T.pnl.loss,
    marginTop: 4,
    minHeight: 15,
  },
});
