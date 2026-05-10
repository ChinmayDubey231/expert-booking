import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS } from "../constants/theme";
import { Button, Card } from "../components/UI";

function fmtDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default function BookingSuccessScreen({ route, navigation }) {
  const { booking, expertName } = route.params;

  const rows = [
    ["Expert", expertName],
    ["Date", fmtDate(booking.date)],
    ["Time", booking.timeSlot],
    ["Name", booking.userName],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Status", booking.status],
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      contentContainerStyle={styles.container}
    >
      {/* Icon */}
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={72} color={COLORS.accent} />
      </View>

      <Text style={styles.title}>Booking Confirmed! 🎉</Text>
      <Text style={styles.subtitle}>
        Your session has been booked. A confirmation will be sent to your email.
      </Text>

      <Card style={styles.detailCard}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.refText}>
        Ref #{booking._id?.slice(-10).toUpperCase()}
      </Text>

      <Button
        title="View My Bookings"
        onPress={() => navigation.navigate("My Bookings")}
        style={styles.btn}
      />
      <Button
        title="Back to Experts"
        variant="outline"
        onPress={() => navigation.navigate("Experts", { screen: "ExpertsList" })}
        style={styles.btn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    gap: 14,
  },
  iconWrap: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "#ECFDF5",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  detailCard: { width: "100%", gap: 10 },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  rowLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: "500" },
  rowValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  refText: { fontSize: 12, color: COLORS.textMuted, fontVariant: ["tabular-nums"] },
  btn: { width: "100%" },
});
