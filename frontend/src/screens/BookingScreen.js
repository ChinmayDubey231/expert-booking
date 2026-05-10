import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createBooking } from "../services/api";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { Button, Card, FormField } from "../components/UI";

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const RULES = {
  userName: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "At least 2 characters";
    return null;
  },
  email: (v) => {
    if (!v.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(v.trim())) return "Enter a valid email";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone is required";
    if (!/^[6-9]\d{9}$/.test(v.trim()))
      return "Enter a valid 10-digit mobile number";
    return null;
  },
  notes: (v) => {
    if (v.length > 500) return "Max 500 characters";
    return null;
  },
};

export default function BookingScreen({ route, navigation }) {
  const { expertId, expertName, date, timeSlot, socketId } = route.params;

  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function setField(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
    const err = RULES[key]?.(val);
    setErrors((p) => ({ ...p, [key]: err ?? undefined }));
  }

  async function handleSubmit() {
    // Full validation
    const errs = {};
    Object.keys(RULES).forEach((k) => {
      const e = RULES[k](form[k] || "");
      if (e) errs[k] = e;
    });
    if (Object.keys(errs).length) {
      setErrors(errs);
      Alert.alert(
        "Fix Errors",
        "Please fill in all required fields correctly.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await createBooking({
        expertId,
        userName: form.userName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        date,
        timeSlot,
        notes: form.notes.trim(),
        socketId, // for real-time updates to other users
      });
      navigation.replace("BookingSuccess", { booking: res.data, expertName });
    } catch (e) {
      Alert.alert("Booking Failed", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Session summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryHeading}>Session Summary</Text>
          <View style={styles.summaryRow}>
            <Ionicons
              name="person-circle-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.summaryText}>{expertName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons
              name="calendar-outline"
              size={15}
              color={COLORS.primary}
            />
            <Text style={styles.summaryText}>{fmtDate(date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={15} color={COLORS.primary} />
            <Text style={styles.summaryText}>{timeSlot}</Text>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Your Details</Text>

        <FormField
          label="Full Name"
          required
          error={errors.userName}
          value={form.userName}
          onChangeText={(v) => setField("userName", v)}
          placeholder="e.g. Chinmay Dubey"
          autoCapitalize="words"
        />

        <FormField
          label="Email"
          required
          error={errors.email}
          value={form.email}
          onChangeText={(v) => setField("email", v)}
          placeholder="e.g. you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormField
          label="Phone"
          required
          error={errors.phone}
          value={form.phone}
          onChangeText={(v) => setField("phone", v)}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
        />

        {/* Notes */}
        <View style={{ marginBottom: SPACING.md }}>
          <Text style={styles.label}>
            Notes <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.textarea, !!errors.notes && styles.inputError]}
            value={form.notes}
            onChangeText={(v) => setField("notes", v)}
            placeholder="What do you want to discuss?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{form.notes.length}/500</Text>
          {!!errors.notes && (
            <Text style={styles.fieldError}>{errors.notes}</Text>
          )}
        </View>

        <Button
          title="Confirm Booking"
          onPress={handleSubmit}
          loading={loading}
        />

        <Text style={styles.disclaimer}>
          You'll receive confirmation details on your email after booking.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: 40 },
  summaryCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
    gap: 8,
  },
  summaryHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  optional: {
    fontSize: 12,
    fontWeight: "400",
    color: COLORS.textMuted,
    textTransform: "none",
  },
  textarea: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 96,
    backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.error },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "right",
    marginTop: 3,
  },
  fieldError: { fontSize: 12, color: COLORS.error, marginTop: 3 },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
