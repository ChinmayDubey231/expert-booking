import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { COLORS, RADIUS, SPACING, SHADOW } from "../constants/theme";

// ── Button ──────────────────────────────────────────────────────
export function Button({ title, onPress, loading, disabled, variant = "primary", size = "md", style }) {
  const bg = {
    primary: COLORS.primary,
    outline: "transparent",
    danger: COLORS.error,
    ghost: "transparent",
  }[variant];

  const textColor = variant === "outline" || variant === "ghost"
    ? COLORS.primary
    : "#fff";

  const borderColor = variant === "outline" ? COLORS.primary : "transparent";
  const pad = size === "sm" ? { paddingVertical: 9, paddingHorizontal: 18 } : { paddingVertical: 14, paddingHorizontal: 22 };
  const fs = size === "sm" ? 13 : 15;

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: isDisabled ? COLORS.border : bg, borderColor, borderWidth: variant === "outline" ? 1.5 : 0 },
        pad,
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={textColor} style={{ marginRight: 6 }} />}
      <Text style={[styles.btnText, { color: isDisabled ? COLORS.textMuted : textColor, fontSize: fs }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ── Card ────────────────────────────────────────────────────────
export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ── Badge ───────────────────────────────────────────────────────
export function Badge({ label, color = COLORS.primary }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "18", borderColor: color + "40" }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ── StatusBadge ─────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    Pending: COLORS.statusPending,
    Confirmed: COLORS.statusConfirmed,
    Completed: COLORS.statusCompleted,
    Cancelled: COLORS.statusCancelled,
  };
  return <Badge label={status} color={map[status] || COLORS.textMuted} />;
}

// ── StarRating ──────────────────────────────────────────────────
export function StarRating({ rating }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Text style={{ color: "#FBBF24", fontSize: 13 }}>★</Text>
      <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textPrimary }}>
        {Number(rating).toFixed(1)}
      </Text>
    </View>
  );
}

// ── FormField ───────────────────────────────────────────────────
export function FormField({ label, error, required, children, containerStyle, ...inputProps }) {
  return (
    <View style={[{ marginBottom: SPACING.md }, containerStyle]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: COLORS.error }}> *</Text>}
      </Text>
      {children ?? (
        <TextInput
          style={[styles.input, !!error && styles.inputError]}
          placeholderTextColor={COLORS.textMuted}
          {...inputProps}
        />
      )}
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Loading ─────────────────────────────────────────────────────
export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      {!!text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
}

// ── Error ───────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.centered}>
      <Text style={{ fontSize: 40 }}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} style={{ marginTop: 16 }} />
      )}
    </View>
  );
}

// ── Empty ───────────────────────────────────────────────────────
export function EmptyState({ icon = "📭", title, subtitle }) {
  return (
    <View style={[styles.centered, { paddingTop: 60 }]}>
      <Text style={{ fontSize: 52 }}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {!!subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  btnText: { fontWeight: "700" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.error },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: SPACING.xl },
  loadingText: { marginTop: 12, fontSize: 14, color: COLORS.textSecondary },
  errorText: { fontSize: 15, color: COLORS.error, textAlign: "center", marginTop: 8, lineHeight: 22 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginTop: 10, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", marginTop: 5, lineHeight: 20 },
});
