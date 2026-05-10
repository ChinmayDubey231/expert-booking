import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchExpertById } from "../services/api";
import useSocket from "../hooks/useSocket";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import {
  Badge,
  StarRating,
  LoadingSpinner,
  ErrorState,
  Button,
} from "../components/UI";

function groupByDate(slots) {
  const map = {};
  slots.forEach((s) => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  });
  return Object.entries(map).sort(([a], [b]) => (a > b ? 1 : -1));
}

function fmtDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function ExpertDetailScreen({ route, navigation }) {
  const { expertId } = route.params;
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]); // [[date, slots[]], ...]
  const [selected, setSelected] = useState(null); // { date, time }

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchExpertById(expertId);
      setExpert(res.data);
      setGroups(groupByDate(res.data.availableSlots));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Real-time socket handlers ──────────────────────────────────
  const onSlotBooked = useCallback(({ date, timeSlot }) => {
    setGroups((prev) =>
      prev.map(([d, slots]) =>
        d === date
          ? [
              d,
              slots.map((s) =>
                s.time === timeSlot ? { ...s, isBooked: true } : s,
              ),
            ]
          : [d, slots],
      ),
    );
    setSelected((prev) => {
      if (prev?.date === date && prev?.time === timeSlot) {
        return null;
      }
      return prev;
    });
  }, []);

  const onSlotFreed = useCallback(({ date, timeSlot }) => {
    setGroups((prev) =>
      prev.map(([d, slots]) =>
        d === date
          ? [
              d,
              slots.map((s) =>
                s.time === timeSlot ? { ...s, isBooked: false } : s,
              ),
            ]
          : [d, slots],
      ),
    );
  }, []);

  const { getSocketId } = useSocket(expertId, onSlotBooked, onSlotFreed);

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!expert) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* Profile */}
        <View style={styles.profile}>
          <Image
            source={{
              uri:
                expert.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name)}&background=2563EB&color=fff&size=200`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{expert.name}</Text>
          <Badge label={expert.category} color={COLORS.primary} />
          <View style={styles.metaRow}>
            <StarRating rating={expert.rating} />
            <Text style={styles.dot}>·</Text>
            <Text style={styles.meta}>{expert.experience} yrs exp</Text>
            <Text style={styles.dot}>·</Text>
            <Text
              style={[styles.meta, { color: COLORS.accent, fontWeight: "700" }]}
            >
              ₹{expert.hourlyRate}/hr
            </Text>
          </View>
          <Text style={styles.bio}>{expert.bio}</Text>
        </View>

        {/* Live banner */}
        <View style={styles.liveBanner}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Availability updates in real-time</Text>
        </View>

        {/* Slot picker */}
        <Text style={styles.sectionTitle}>Available Slots</Text>

        {groups.map(([date, slots]) => (
          <View key={date} style={styles.dateBlock}>
            <View style={styles.dateRow}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={COLORS.primary}
              />
              <Text style={styles.dateLabel}>{fmtDate(date)}</Text>
            </View>
            <View style={styles.slotGrid}>
              {slots.map((slot) => {
                const isSelected =
                  selected?.date === date && selected?.time === slot.time;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    disabled={slot.isBooked}
                    onPress={() =>
                      setSelected(isSelected ? null : { date, time: slot.time })
                    }
                    style={[
                      styles.slot,
                      slot.isBooked && styles.slotBooked,
                      isSelected && styles.slotSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        slot.isBooked && styles.slotTextBooked,
                        isSelected && styles.slotTextSelected,
                      ]}
                    >
                      {slot.time}
                    </Text>
                    {slot.isBooked && (
                      <Text style={styles.slotSubText}>Booked</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Sticky CTA */}
      {selected && (
        <View style={styles.cta}>
          <View>
            <Text style={styles.ctaLabel}>Selected</Text>
            <Text style={styles.ctaValue}>
              {fmtDate(selected.date)} · {selected.time}
            </Text>
          </View>
          <Button
            title="Book Now"
            size="sm"
            onPress={() =>
              navigation.navigate("Booking", {
                expertId: expert._id,
                expertName: expert.name,
                date: selected.date,
                timeSlot: selected.time,
                socketId: getSocketId(),
              })
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  profile: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  name: { fontSize: 21, fontWeight: "800", color: COLORS.textPrimary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { color: COLORS.textMuted },
  meta: { fontSize: 13, color: COLORS.textSecondary },
  bio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 2,
  },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  liveText: { fontSize: 12, fontWeight: "600", color: COLORS.accent },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: 4,
  },
  dateBlock: { paddingHorizontal: SPACING.md, marginBottom: SPACING.md },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  dateLabel: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slot: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    minWidth: 88,
  },
  slotBooked: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.border,
  },
  slotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotText: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  slotTextBooked: {
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
  },
  slotTextSelected: { color: "#fff" },
  slotSubText: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.md,
  },
  ctaLabel: { fontSize: 11, color: COLORS.textMuted },
  ctaValue: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
});
