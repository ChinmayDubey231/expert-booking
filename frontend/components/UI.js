import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { COLORS, RADIUS, SPACING, SHADOW } from "../constants/theme";

// ─── Button ─────────────────────────────────────────────────────
export const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary", // primary | secondary | outline | danger
  size = "md",
  style,
}) => {
  const variantStyles = {
    primary: { bg: COLORS.primary, text: "#fff", border: COLORS.primary },
    secondary: { bg: COLORS.accent, text: "#fff", border: COLORS.accent },
    outline: { bg: "transparent", text: COLORS.primary, border: COLORS.primary },
    danger: { bg: COLORS.error, text: "#fff", border: COLORS.error },
  };
  const sizeStyles = {
    sm: { py: 8, px: 16, fontSize: 13 },
    md: { py: 14, px: 20, fontSize: 15 },
    lg: { py: 16, px: 24, fontSize: 16 },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        {
          backgroundColor: disabled ? COLORS.border : v.bg,
          borderWidth: 1.5,
          borderColor: disabled ? COLORS.border : v.border,
          borderRadius: RADIUS.md,
          paddingVertical: s.py,
          paddingHorizontal: s.px,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
        },
        style,
      ]}
    >
      {loading && <ActivityIndicator size="small" color={v.text} />}
      <Text
        style={{
          color: disabled ? COLORS.textMuted : v.text,
          fontSize: s.fontSize,
          fontWeight: "600",
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// ─── Card ────────────────────────────────────────────────────────
export const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ─── Badge ───────────────────────────────────────────────────────
export const Badge = ({ label, color = COLORS.primary }) => (
  <View style={[styles.badge, { backgroundColor: color + "20", borderColor: color + "40" }]}>
    <Text style={[styles.badgeText, { color }]}>{label}</Text>
  </View>
);

// ─── StatusBadge ─────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const colorMap = {
    Pending: COLORS.pending,
    Confirmed: COLORS.confirmed,
    Completed: COLORS.completed,
    Cancelled: COLORS.cancelled,
  };
  return <Badge label={status} color={colorMap[status] || COLORS.textMuted} />;
};

// ─── StarRating ──────────────────────────────────────────────────
export const StarRating = ({ rating }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
    <Text style={{ fontSize: 14, color: COLORS.warning }}>★</Text>
    <Text style={{ fontSize: 13, fontWeight: "600", color: COLORS.textPrimary }}>
      {rating?.toFixed(1)}
    </Text>
  </View>
);

// ─── Empty State ─────────────────────────────────────────────────
export const EmptyState = ({ icon = "📭", title, subtitle, action }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action}
  </View>
);

// ─── Loading Spinner ─────────────────────────────────────────────
export const LoadingSpinner = ({ text = "Loading..." }) => (
  <View style={styles.centered}>
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>{text}</Text>
  </View>
);

// ─── Error State ─────────────────────────────────────────────────
export const ErrorState = ({ message, onRetry }) => (
  <View style={styles.centered}>
    <Text style={styles.emptyIcon}>⚠️</Text>
    <Text style={styles.errorText}>{message}</Text>
    {onRetry && (
      <Button title="Try Again" onPress={onRetry} style={{ marginTop: 16 }} />
    )}
  </View>
);

// ─── Form Field ──────────────────────────────────────────────────
import { TextInput } from "react-native";

export const FormField = ({
  label,
  error,
  required,
  style,
  children,
  ...props
}) => (
  <View style={[{ marginBottom: SPACING.md }, style]}>
    <Text style={styles.label}>
      {label}
      {required && <Text style={{ color: COLORS.error }}> *</Text>}
    </Text>
    {children || (
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={COLORS.textMuted}
        {...props}
      />
    )}
    {error && <Text style={styles.errorMsg}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  badge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    padding: SPACING.xl,
    gap: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  errorText: {
    fontSize: 15,
    color: COLORS.error,
    textAlign: "center",
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.error },
  errorMsg: { fontSize: 12, color: COLORS.error, marginTop: 4 },
});
