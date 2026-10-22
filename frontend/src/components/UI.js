import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, TextInput, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, RADIUS, SPACING, STATUS_COLORS, TYPE } from "../constants/theme";
import { initials } from "../utils/format";

// ── Button ──────────────────────────────────────────────────────
const BUTTON_VARIANTS = {
  primary: { bg: COLORS.accent, pressed: COLORS.accentPressed, fg: "#fff", border: COLORS.accent },
  secondary: { bg: COLORS.surface, pressed: COLORS.lineSoft, fg: COLORS.ink, border: COLORS.line },
  destructive: { bg: COLORS.surface, pressed: COLORS.dangerTint, fg: COLORS.danger, border: COLORS.dangerLine },
};

export function Button({ title, onPress, loading, disabled, variant = "primary", size = "md", icon, style }) {
  const v = BUTTON_VARIANTS[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        size === "sm" && styles.btnSm,
        { backgroundColor: pressed ? v.pressed : v.bg, borderColor: v.border },
        isDisabled && styles.btnDisabled,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={v.fg} />}
      <Text style={[styles.btnText, size === "sm" && styles.btnTextSm, { color: v.fg }]}>{title}</Text>
      {!!icon && !loading && <Ionicons name={icon} size={18} color={v.fg} />}
    </Pressable>
  );
}

// ── BackButton ──────────────────────────────────────────────────
export function BackButton({ onPress, label = "Back" }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: COLORS.lineSoft }]}
    >
      <Ionicons name="chevron-back" size={20} color={COLORS.ink} />
    </Pressable>
  );
}

// ── Card ────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Pill / StatusBadge ──────────────────────────────────────────
export function Pill({ label, fg = COLORS.accent, bg = COLORS.accentTint, dot, small, style }) {
  return (
    <View style={[styles.pill, small && styles.pillSmall, { backgroundColor: bg }, style]}>
      {dot && <View style={[styles.pillDot, { backgroundColor: fg }]} />}
      <Text style={[styles.pillText, small && styles.pillTextSmall, { color: fg }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status, small }) {
  const c = STATUS_COLORS[status] ?? { fg: COLORS.textSecondary, bg: COLORS.lineSoft };
  return <Pill label={status} fg={c.fg} bg={c.bg} small={small} />;
}

// ── Rating ──────────────────────────────────────────────────────
export function StarRating({ rating, size = 14, textStyle }) {
  return (
    <View style={styles.rating} accessibilityLabel={`Rated ${Number(rating).toFixed(1)} out of 5`}>
      <Ionicons name="star" size={size} color={COLORS.star} />
      <Text style={[TYPE.smallStrong, textStyle]}>{Number(rating).toFixed(1)}</Text>
    </View>
  );
}

// ── Avatar — photo, or initials if there's none or it fails to load ──
export function Avatar({ uri, name, size = 56, radius = 14 }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, borderRadius: radius };
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[box, { backgroundColor: COLORS.accentTint }]}
        onError={() => setFailed(true)}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return (
    <View style={[box, styles.initialsBox]}>
      <Text style={[styles.initialsText, { fontSize: Math.round(size / 3) }]}>{initials(name)}</Text>
    </View>
  );
}

// ── FormField ───────────────────────────────────────────────────
export function FormField({ label, optional, error, prefix, footer, containerStyle, multiline, ...inputProps }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}> (optional)</Text>}
      </Text>
      {/* The outer ring only shows on focus; negative margin keeps the box aligned */}
      <View style={[styles.ring, focused && !error && { backgroundColor: COLORS.accentRing }]}>
        <View
          style={[
            styles.inputBox,
            multiline && styles.inputBoxMultiline,
            focused && styles.inputFocused,
            !!error && styles.inputError,
          ]}
        >
          {!!prefix && <Text style={styles.prefix}>{prefix}</Text>}
          <TextInput
            placeholderTextColor={COLORS.placeholder}
            accessibilityLabel={label}
            multiline={multiline}
            textAlignVertical={multiline ? "top" : "center"}
            {...inputProps}
            style={[styles.input, multiline && styles.inputMultiline]}
            onFocus={(e) => {
              setFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              inputProps.onBlur?.(e);
            }}
          />
        </View>
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
      {!error && footer}
    </View>
  );
}

// ── States ──────────────────────────────────────────────────────
export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      {!!text && <Text style={[TYPE.small, { marginTop: SPACING.md }]}>{text}</Text>}
    </View>
  );
}

function StateIcon({ name, fg = COLORS.accent, bg = COLORS.accentTint }) {
  return (
    <View style={[styles.stateIcon, { backgroundColor: bg }]}>
      <Ionicons name={name} size={28} color={fg} />
    </View>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.centered}>
      <StateIcon name="cloud-offline-outline" fg={COLORS.danger} bg={COLORS.dangerTint} />
      <Text style={[TYPE.heading, styles.stateTitle]}>Something went wrong</Text>
      <Text style={[TYPE.small, styles.stateText]}>{message}</Text>
      {onRetry && (
        <Button title="Try again" variant="secondary" size="sm" onPress={onRetry} style={{ marginTop: SPACING.lg }} />
      )}
    </View>
  );
}

export function EmptyState({ icon = "file-tray-outline", title, subtitle, children }) {
  return (
    <View style={[styles.centered, { paddingTop: 48 }]}>
      <StateIcon name={icon} />
      <Text style={[TYPE.heading, styles.stateTitle]}>{title}</Text>
      {!!subtitle && <Text style={[TYPE.small, styles.stateText]}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSm: { height: 44, paddingHorizontal: 16, borderRadius: RADIUS.field },
  btnDisabled: { opacity: 0.45 },
  btnText: { fontFamily: FONTS.bold, fontSize: 16 },
  btnTextSm: { fontSize: 14 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: SPACING.lg,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  pillSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: FONTS.bold, fontSize: 12, lineHeight: 16 },
  pillTextSmall: { fontSize: 11, lineHeight: 14 },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  initialsBox: { backgroundColor: COLORS.accentTint, alignItems: "center", justifyContent: "center" },
  initialsText: { fontFamily: FONTS.extrabold, color: COLORS.accent },
  field: { gap: 6 },
  label: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  optional: { fontFamily: FONTS.medium, color: COLORS.textMuted },
  ring: { margin: -3, padding: 3, borderRadius: RADIUS.field + 3 },
  inputBox: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.field,
    backgroundColor: COLORS.surface,
  },
  inputBoxMultiline: { alignItems: "stretch" },
  inputFocused: { borderColor: COLORS.accent },
  inputError: { borderColor: COLORS.danger },
  prefix: {
    fontFamily: FONTS.semibold,
    fontSize: 15,
    color: COLORS.textSecondary,
    paddingLeft: 14,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: COLORS.line,
  },
  input: {
    flex: 1,
    minHeight: 47,
    paddingHorizontal: 14,
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.ink,
  },
  inputMultiline: { minHeight: 88, paddingTop: 12, paddingBottom: 12, lineHeight: 21 },
  fieldError: { fontFamily: FONTS.semibold, fontSize: 12, lineHeight: 16, color: COLORS.danger },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xxxl },
  stateIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  stateTitle: { marginTop: SPACING.lg, textAlign: "center" },
  stateText: { marginTop: SPACING.xs, textAlign: "center", maxWidth: 280 },
});
