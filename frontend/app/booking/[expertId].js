import React, { useState } from "react";
import {
  View, Text, ScrollView, TextInput, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { createBooking } from "../../services/api";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import { Button, Card, FormField } from "../../components/UI";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
};

// ─── Validators ──────────────────────────────────────────────────
const validators = {
  userName: (v) => {
    if (!v.trim()) return "Full name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    return null;
  },
  email: (v) => {
    if (!v.trim()) return "Email is required";
    if (!/^\S+@\S+\.\S+$/.test(v)) return "Enter a valid email address";
    return null;
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    if (!/^[6-9]\d{9}$/.test(v)) return "Enter a valid 10-digit mobile number";
    return null;
  },
  notes: (v) => {
    if (v.length > 500) return "Notes cannot exceed 500 characters";
    return null;
  },
};

const validateAll = (form) => {
  const errs = {};
  Object.keys(validators).forEach((field) => {
    const err = validators[field](form[field] || "");
    if (err) errs[field] = err;
  });
  return errs;
};

export default function BookingScreen() {
  const { expertId, expertName, date, timeSlot } = useLocalSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({
    userName: "",
    email: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedData, setBookedData] = useState(null);

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Live validation
    const err = validators[field]?.(value);
    setErrors((prev) => ({ ...prev, [field]: err || undefined }));
  };

  const handleSubmit = async () => {
    const errs = validateAll(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert("Validation Error", "Please fix the highlighted fields.");
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
      });
      setBookedData(res.data);
      setSuccess(true);
    } catch (err) {
      Alert.alert("Booking Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success && bookedData) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.accent} />
        </View>
        <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
        <Text style={styles.successSubtitle}>Your session has been booked successfully.</Text>

        <Card style={styles.successCard}>
          {[
            ["Expert", expertName],
            ["Date", formatDate(date)],
            ["Time", timeSlot],
            ["Name", bookedData.userName],
            ["Email", bookedData.email],
            ["Status", bookedData.status],
          ].map(([label, value]) => (
            <View key={label} style={styles.successRow}>
              <Text style={styles.successLabel}>{label}</Text>
              <Text style={styles.successValue}>{value}</Text>
            </View>
          ))}
        </Card>

        <Button
          title="View My Bookings"
          onPress={() => router.replace("/my-bookings")}
          style={{ width: "100%", marginBottom: 12 }}
        />
        <Button
          title="Back to Experts"
          variant="outline"
          onPress={() => router.replace("/")}
          style={{ width: "100%" }}
        />
      </View>
    );
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
          <Text style={styles.summaryTitle}>Session Details</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
            <Text style={styles.summaryText}>{expertName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
            <Text style={styles.summaryText}>{formatDate(date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
            <Text style={styles.summaryText}>{timeSlot}</Text>
          </View>
        </Card>

        {/* Form */}
        <Text style={styles.sectionLabel}>Your Information</Text>

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
          label="Email Address"
          required
          error={errors.email}
          value={form.email}
          onChangeText={(v) => setField("email", v)}
          placeholder="e.g. you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <FormField
          label="Phone Number"
          required
          error={errors.phone}
          value={form.phone}
          onChangeText={(v) => setField("phone", v)}
          placeholder="10-digit mobile number"
          keyboardType="number-pad"
          maxLength={10}
        />

        <View style={{ marginBottom: SPACING.md }}>
          <Text style={styles.inputLabel}>
            Notes / Questions <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.textarea, errors.notes && styles.inputError]}
            value={form.notes}
            onChangeText={(v) => setField("notes", v)}
            placeholder="What would you like to discuss in this session?"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{form.notes.length}/500</Text>
          {errors.notes && <Text style={styles.errorMsg}>{errors.notes}</Text>}
        </View>

        <Button
          title="Confirm Booking"
          onPress={handleSubmit}
          loading={loading}
          style={{ marginTop: 8 }}
        />

        <Text style={styles.disclaimer}>
          By booking, you agree to the session terms. You'll receive a confirmation
          on your email.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  summaryCard: {
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    gap: 8,
  },
  summaryTitle: { fontSize: 13, fontWeight: "700", color: COLORS.primary, marginBottom: 4 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: "500" },
  sectionLabel: {
    fontSize: 16, fontWeight: "700", color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary, marginBottom: 6 },
  optional: { fontSize: 12, fontWeight: "400", color: COLORS.textMuted },
  textarea: {
    borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, padding: 12,
    fontSize: 15, color: COLORS.textPrimary,
    minHeight: 100, backgroundColor: COLORS.surface,
  },
  inputError: { borderColor: COLORS.error },
  charCount: { fontSize: 11, color: COLORS.textMuted, textAlign: "right", marginTop: 4 },
  errorMsg: { fontSize: 12, color: COLORS.error, marginTop: 4 },
  disclaimer: {
    fontSize: 12, color: COLORS.textMuted, textAlign: "center",
    marginTop: SPACING.md, lineHeight: 18,
  },
  // Success
  successContainer: {
    flex: 1, backgroundColor: COLORS.background,
    padding: SPACING.lg, alignItems: "center", justifyContent: "center",
    gap: 12,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  successSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  successCard: { width: "100%", marginVertical: SPACING.md, gap: 10 },
  successRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  successLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  successValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
});
