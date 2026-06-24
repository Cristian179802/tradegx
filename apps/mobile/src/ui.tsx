// Design system premium TradeGx — componente native reutilizabile.
import { ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
  ActivityIndicator,
  PressableProps,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { colors, gradients, shadow, radius, spacing, font } from "./theme";

// ── Pressable cu scale + haptic (senzație premium la atingere) ────────────────
export function PressableScale({
  children,
  onPress,
  haptic = true,
  style,
  ...rest
}: PressableProps & { haptic?: boolean; style?: StyleProp<ViewStyle> }) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPressIn={() => (scale.value = withSpring(0.96, { damping: 15 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15 }))}
        onPress={(e) => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(e);
        }}
        style={style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ── Card premium ──────────────────────────────────────────────────────────────
export function Card({
  children,
  style,
  glow = false,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
  padded?: boolean;
}) {
  return (
    <View
      style={[
        s.card,
        padded && { padding: spacing.lg },
        glow && shadow.glow,
        !glow && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ── Button (variante premium) ───────────────────────────────────────────────
type BtnVariant = "primary" | "bull" | "bear" | "secondary" | "ghost";
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
  full = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  full?: boolean;
}) {
  const grad =
    variant === "primary" ? gradients.brand : variant === "bull" ? gradients.bull : variant === "bear" ? gradients.bear : null;
  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.text : colors.white} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={variant === "ghost" ? colors.primary : colors.white} />}
          <Text style={[s.btnLabel, (variant === "secondary" || variant === "ghost") && { color: variant === "ghost" ? colors.primary : colors.text }]}>
            {label}
          </Text>
        </>
      )}
    </>
  );
  return (
    <PressableScale onPress={disabled || loading ? undefined : onPress} style={[full && { width: "100%" }, { opacity: disabled ? 0.5 : 1 }]}>
      {grad ? (
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[s.btn, variant === "secondary" ? s.btnSecondary : s.btnGhost]}>{content}</View>
      )}
    </PressableScale>
  );
}

// ── StatCard (KPI) ─────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  delta,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: "bull" | "bear" | "neutral";
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const toneColor = tone === "bull" ? colors.bull : tone === "bear" ? colors.bear : colors.text;
  return (
    <Card style={{ flex: 1 }}>
      <View style={s.row}>
        <Text style={s.statLabel}>{label.toUpperCase()}</Text>
        {icon && <Ionicons name={icon} size={16} color={colors.textMuted} />}
      </View>
      <Text style={[s.statValue, { color: toneColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {delta != null && <Text style={[s.statDelta, { color: toneColor }]}>{delta}</Text>}
    </Card>
  );
}

// ── Badge (pill) ─────────────────────────────────────────────────────────────
export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "bull" | "bear" | "neutral" | "warn" | "info";
}) {
  const map = {
    bull: { bg: colors.bullSoft, fg: colors.bull },
    bear: { bg: colors.bearSoft, fg: colors.bear },
    warn: { bg: colors.warnSoft, fg: colors.warn },
    info: { bg: colors.primarySoft, fg: colors.info },
    neutral: { bg: colors.surfaceHi, fg: colors.textMuted },
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor: map.bg }]}>
      <Text style={[s.badgeText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

// ── SectionTitle ──────────────────────────────────────────────────────────────
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={[s.row, { marginBottom: spacing.md, marginTop: spacing.lg }]}>
      <Text style={s.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  btn: {
    height: 52,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  btnSecondary: { backgroundColor: colors.surfaceHi, borderWidth: 1, borderColor: colors.border },
  btnGhost: { backgroundColor: "transparent" },
  btnLabel: { color: colors.white, fontSize: font.size.base, fontWeight: font.weight.semibold },
  statLabel: { color: colors.textMuted, fontSize: font.size.xs, fontWeight: font.weight.semibold, letterSpacing: 0.5 },
  statValue: { fontSize: font.size["2xl"], fontWeight: font.weight.heavy, marginTop: spacing.xs },
  statDelta: { fontSize: font.size.sm, fontWeight: font.weight.semibold, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, alignSelf: "flex-start" },
  badgeText: { fontSize: font.size.xs, fontWeight: font.weight.bold, letterSpacing: 0.3 },
  sectionTitle: { color: colors.text, fontSize: font.size.lg, fontWeight: font.weight.bold },
});
