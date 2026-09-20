import * as React from "react";
import { Animated, Easing, type StyleProp, type ViewStyle } from "react-native";

// ── Dezvăluire la intrare ────────────────────────────────────────────────────
//
// Echivalentul lui `.tg-reveal` din web: elementul urcă 10px și se limpezește
// la apariție. Pe web se declanșa la intrarea în cadru; aici, la montare —
// pe un ecran de telefon aproape tot ce montezi e deja vizibil, iar un
// observator de intersecție ar fi complexitate fără câștig.
//
// `intarziere` dă cascada. Regula: 45–70ms între elemente. Sub 40 se citește ca
// simultan, peste 90 începe să pară că aplicația se încarcă greu.
//
// Driver nativ. Un ecran cu opt carduri care intră în cascadă nu are voie să
// atingă firul de JavaScript — acolo se încarcă datele în același timp.

export interface RevealProps {
  children: React.ReactNode;
  intarziere?: number;
  /** Distanța de pe care urcă, px. */
  distanta?: number;
  durata?: number;
  style?: StyleProp<ViewStyle>;
}

export function Reveal({
  children,
  intarziere = 0,
  distanta = 10,
  durata = 460,
  style,
}: RevealProps) {
  const p = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const a = Animated.timing(p, {
      toValue: 1,
      duration: durata,
      delay: intarziere,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [p, durata, intarziere]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: p,
          transform: [
            { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [distanta, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
