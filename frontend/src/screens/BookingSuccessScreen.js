import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, GUTTER, RADIUS, SPACING, TYPE } from "../constants/theme";
import { bookingRef, formatDate, formatPrice } from "../utils/format";
import { Button, StatusBadge } from "../components/UI";

function Row({ label, children }) {
  return (
    <View style={styles.row}>
      <Text style={TYPE.small}>{label}</Text>
      {typeof children === "string" ? <Text style={styles.rowValue}>{children}</Text> : children}
    </View>
  );
}

export default function BookingSuccessScreen({ route, navigation }) {
  const { booking, expertName, hourlyRate } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 56, paddingBottom: insets.bottom + SPACING.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.checkOuter}>
          <View style={styles.checkInner}>
            <Ionicons name="checkmark" size={32} color="#fff" />
          </View>
        </View>
        <Text style={styles.title} accessibilityRole="header">You're booked</Text>
        <Text style={styles.subtitle}>
          Your session with {expertName} is confirmed for {formatDate(booking.date, "day")} at {booking.timeSlot}.
        </Text>
      </View>

      {/* Ticket */}
      <View style={styles.ticket}>
        <View style={styles.ticketBody}>
          <Row label="Expert">{expertName}</Row>
          <Row label="Date">{formatDate(booking.date, "mediumDay")}</Row>
          <Row label="Time">{`${booking.timeSlot} · 60 min`}</Row>
          {hourlyRate != null && <Row label="Fee">{formatPrice(hourlyRate)}</Row>}
          <Row label="Status"><StatusBadge status={booking.status} /></Row>
        </View>
        {/* Dashed single edges don't render on iOS, so clip a dashed box to its top edge */}
        <View style={styles.perforationClip}>
          <View style={styles.perforationLine} />
        </View>
        <View style={styles.ticketFoot}>
          <Text style={TYPE.small}>Booking ref</Text>
          <Text style={styles.ref}>#{bookingRef(booking)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="View my bookings"
          onPress={() => navigation.popTo("Tabs", { screen: "MyBookings" })}
        />
        <Button
          title="Back to experts"
          variant="secondary"
          onPress={() => navigation.popTo("Tabs", { screen: "Experts" })}
        />
        <Text style={[TYPE.caption, { textAlign: "center", marginTop: 4 }]}>
          You can view or cancel it anytime from My bookings.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  content: { flexGrow: 1, paddingHorizontal: GUTTER },
  hero: { alignItems: "center", gap: SPACING.md },
  checkOuter: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.accentTint,
    alignItems: "center", justifyContent: "center",
  },
  checkInner: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
  },
  title: {
    fontFamily: FONTS.extrabold, fontSize: 26, lineHeight: 32, letterSpacing: -0.4,
    color: COLORS.ink, marginTop: SPACING.sm,
  },
  subtitle: { ...TYPE.body, textAlign: "center", maxWidth: 300 },
  ticket: {
    marginTop: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.hero,
    overflow: "hidden",
  },
  ticketBody: { padding: 18, gap: SPACING.md },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: SPACING.lg },
  rowValue: { fontFamily: FONTS.bold, fontSize: 14, lineHeight: 20, color: COLORS.ink, flexShrink: 1, textAlign: "right" },
  perforationClip: { height: 1.5, marginHorizontal: 18, overflow: "hidden" },
  perforationLine: { height: 6, borderWidth: 1.5, borderColor: COLORS.line, borderStyle: "dashed", borderRadius: 1 },
  ticketFoot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: COLORS.surfaceSunken,
  },
  ref: { fontFamily: FONTS.extrabold, fontSize: 15, letterSpacing: 1, color: COLORS.ink, fontVariant: ["tabular-nums"] },
  actions: { marginTop: "auto", paddingTop: SPACING.xxxl, gap: 10 },
});
