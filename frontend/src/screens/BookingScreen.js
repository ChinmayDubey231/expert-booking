import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { createBooking } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import useSlotUpdates from "../hooks/useSlotUpdates";
import { COLORS, FONTS, GUTTER, RADIUS, SHADOW, SPACING, TYPE } from "../constants/theme";
import { formatDate, formatPrice } from "../utils/format";
import { Avatar, BackButton, Button, Card, FormField } from "../components/UI";

const NOTES_MAX = 500;

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
    if (!v.trim()) return "Mobile number is required";
    if (!/^[6-9]\d{9}$/.test(v.trim())) return "Enter a valid 10-digit mobile number";
    return null;
  },
  notes: (v) => {
    if (v.length > NOTES_MAX) return `Max ${NOTES_MAX} characters`;
    return null;
  },
};

function SummaryItem({ icon, value, label }) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons name={icon} size={18} color={COLORS.accent} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={TYPE.caption}>{label}</Text>
      </View>
    </View>
  );
}

export default function BookingScreen({ route, navigation }) {
  const { expertId, expertName, expertImage, category, hourlyRate, date, timeSlot } = route.params;
  const insets = useSafeAreaInsets();
  const { profile, ready, updateProfile } = useProfile();

  const [form, setForm] = useState({ userName: "", email: "", phone: "", notes: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slotTaken, setSlotTaken] = useState(null); // reason the slot can't be booked
  const [prefilled, setPrefilled] = useState(false);
  const submittingRef = useRef(false);
  const prefilledRef = useRef(false);

  // Prefill details saved from a previous booking, without overwriting anything typed
  useEffect(() => {
    if (!ready || prefilledRef.current) return;
    prefilledRef.current = true;
    setPrefilled(!!(profile.userName || profile.email || profile.phone));
    setForm((prev) => ({
      ...prev,
      userName: prev.userName || profile.userName,
      email: prev.email || profile.email,
      phone: prev.phone || profile.phone,
    }));
  }, [ready, profile]);

  // Warn as soon as someone else takes this slot, instead of failing on submit
  useSlotUpdates(expertId, {
    onSlotBooked: (d) => {
      // Our own booking triggers this event too, possibly before the HTTP response
      if (!submittingRef.current && d.date === date && d.timeSlot === timeSlot) {
        setSlotTaken("Someone else just booked it. Go back and pick another time.");
      }
    },
    onSlotFreed: (d) => {
      if (d.date === date && d.timeSlot === timeSlot) setSlotTaken(null);
    },
  });

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
      Alert.alert("Check your details", "Please fix the highlighted fields.");
      return;
    }

    const details = {
      userName: form.userName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    };

    submittingRef.current = true;
    setLoading(true);
    try {
      const res = await createBooking({
        expertId,
        ...details,
        date,
        timeSlot,
        notes: form.notes.trim(),
      });
      updateProfile(details);
      navigation.replace("BookingSuccess", { booking: res.data, expertName, hourlyRate });
    } catch (e) {
      if (e.status === 409) setSlotTaken(e.message); // taken, or its start time has passed
      else Alert.alert("Booking failed", e.message);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const hasFee = hourlyRate != null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <BackButton onPress={() => navigation.goBack()} label="Back to profile" />
        <Text style={styles.topTitle} accessibilityRole="header">Confirm booking</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {slotTaken && (
          <View style={styles.takenBanner} accessibilityRole="alert">
            <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
            <View style={{ flex: 1 }}>
              <Text style={styles.takenTitle}>This slot is no longer available</Text>
              <Text style={styles.takenText}>{slotTaken}</Text>
            </View>
          </View>
        )}

        {/* Session summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.expertRow}>
            <Avatar uri={expertImage} name={expertName} size={48} radius={14} />
            <View style={{ flex: 1 }}>
              <Text style={TYPE.bodyStrong}>{expertName}</Text>
              {!!category && <Text style={TYPE.small}>{category}</Text>}
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryGrid}>
            <SummaryItem icon="calendar-outline" value={formatDate(date, "short")} label={`${timeSlot} · 60 min`} />
            {hasFee && <SummaryItem icon="wallet-outline" value={formatPrice(hourlyRate)} label="Session fee" />}
          </View>
        </Card>

        {/* Details */}
        <View style={styles.sectionHeader}>
          <Text style={TYPE.heading}>Your details</Text>
          {prefilled && (
            <View style={styles.savedHint}>
              <Ionicons name="checkmark" size={14} color={COLORS.accent} />
              <Text style={TYPE.caption}>Saved from last time</Text>
            </View>
          )}
        </View>

        <View style={styles.fields}>
          <FormField
            label="Full name"
            error={errors.userName}
            value={form.userName}
            onChangeText={(v) => setField("userName", v)}
            placeholder="e.g. Chinmay Dubey"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
          />
          <FormField
            label="Email"
            error={errors.email}
            value={form.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
          />
          <FormField
            label="Mobile number"
            prefix="+91"
            error={errors.phone}
            value={form.phone}
            onChangeText={(v) => setField("phone", v.replace(/\D/g, ""))}
            placeholder="10-digit number"
            keyboardType="number-pad"
            maxLength={10}
            autoComplete="tel"
            textContentType="telephoneNumber"
          />
          <FormField
            label="Notes"
            optional
            multiline
            numberOfLines={4}
            maxLength={NOTES_MAX}
            error={errors.notes}
            value={form.notes}
            onChangeText={(v) => setField("notes", v)}
            placeholder="What would you like to discuss?"
            footer={<Text style={[TYPE.caption, styles.counter]}>{form.notes.length}/{NOTES_MAX}</Text>}
          />
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + SPACING.md }]}>
        {slotTaken ? (
          <Button title="Choose another slot" variant="secondary" onPress={() => navigation.goBack()} />
        ) : (
          <Button
            title={hasFee ? `Confirm booking · ${formatPrice(hourlyRate)}` : "Confirm booking"}
            onPress={handleSubmit}
            loading={loading}
          />
        )}
        <Text style={[TYPE.caption, { textAlign: "center" }]}>
          You can cancel anytime before the session starts
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    paddingBottom: SPACING.sm,
  },
  topTitle: { ...TYPE.heading, flex: 1, textAlign: "center" },
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.sm, paddingBottom: SPACING.xxl },
  takenBanner: {
    flexDirection: "row",
    gap: 10,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.card,
    backgroundColor: COLORS.dangerTint,
    borderWidth: 1,
    borderColor: COLORS.dangerLine,
  },
  takenTitle: { fontFamily: FONTS.bold, fontSize: 14, lineHeight: 20, color: COLORS.danger },
  takenText: { fontFamily: FONTS.medium, fontSize: 13, lineHeight: 18, color: COLORS.danger, marginTop: 2 },
  summaryCard: { gap: 14 },
  expertRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.lineSoft },
  summaryGrid: { flexDirection: "row", gap: SPACING.md },
  summaryItem: { flex: 1, flexDirection: "row", gap: 10 },
  summaryValue: { fontFamily: FONTS.bold, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 14,
  },
  savedHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  fields: { gap: 14 },
  counter: { alignSelf: "flex-end" },
  bar: {
    gap: 10,
    paddingHorizontal: GUTTER,
    paddingTop: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    ...SHADOW.bar,
  },
});
