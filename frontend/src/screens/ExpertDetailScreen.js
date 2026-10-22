import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, Alert, RefreshControl, useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchExpertById } from "../services/api";
import useSlotUpdates from "../hooks/useSlotUpdates";
import { COLORS, FONTS, GUTTER, RADIUS, SHADOW, SPACING, TYPE } from "../constants/theme";
import { formatDate, formatPrice, parseDateKey } from "../utils/format";
import { Avatar, BackButton, Button, Pill, LoadingSpinner, ErrorState, EmptyState } from "../components/UI";

const SLOT_COLUMNS = 3;
const SLOT_GAP = 8;

// [[date, slots[]], ...] sorted by date
function groupByDate(slots) {
  const map = {};
  slots.forEach((s) => {
    if (!map[s.date]) map[s.date] = [];
    map[s.date].push(s);
  });
  return Object.entries(map).sort(([a], [b]) => (a > b ? 1 : -1));
}

const hasFreeSlot = ([, slots]) => slots.some((s) => !s.isBooked);

function Stat({ value, label, icon }) {
  return (
    <View style={styles.stat}>
      <View style={styles.statValueRow}>
        {icon}
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={TYPE.caption}>{label}</Text>
    </View>
  );
}

export default function ExpertDetailScreen({ route, navigation }) {
  const { expertId } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slotWidth = (width - GUTTER * 2 - SLOT_GAP * (SLOT_COLUMNS - 1)) / SLOT_COLUMNS;

  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [groups, setGroups] = useState([]);
  const [activeDate, setActiveDate] = useState(null);
  const [selected, setSelected] = useState(null); // { date, time }

  // mode: "initial" | "refresh" (pull-to-refresh) | "resync" (silent, after reconnect)
  const load = useCallback(async (mode = "initial") => {
    if (mode === "refresh") setRefreshing(true);
    try {
      setError(null);
      const res = await fetchExpertById(expertId);
      const next = groupByDate(res.data.availableSlots);
      setExpert(res.data);
      setGroups(next);
      // Keep the chosen day if it still exists, otherwise jump to the first day with space
      setActiveDate((prev) =>
        next.some(([d]) => d === prev) ? prev : (next.find(hasFreeSlot) ?? next[0])?.[0] ?? null
      );
      // Drop the selection if that slot has gone or been taken
      setSelected((prev) =>
        prev &&
        next.some(([d, slots]) => d === prev.date && slots.some((s) => s.time === prev.time && !s.isBooked))
          ? prev
          : null
      );
    } catch (e) {
      if (mode === "refresh") Alert.alert("Couldn't refresh", e.message);
      else if (mode === "initial") setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [expertId]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time updates ──────────────────────────────────────────
  const markSlot = (date, time, isBooked) =>
    setGroups((prev) =>
      prev.map(([d, slots]) =>
        d === date ? [d, slots.map((s) => (s.time === time ? { ...s, isBooked } : s))] : [d, slots]
      )
    );

  const connected = useSlotUpdates(expertId, {
    onSlotBooked: ({ date, timeSlot }) => {
      markSlot(date, timeSlot, true);
      if (selected?.date === date && selected?.time === timeSlot) {
        setSelected(null);
        // Only interrupt if this screen is in view. If the user has moved on to the booking
        // form, that screen handles it — and it may well have been their own booking.
        if (navigation.isFocused()) {
          Alert.alert("Slot taken", "Someone just booked this slot. Please pick another.");
        }
      }
    },
    onSlotFreed: ({ date, timeSlot }) => markSlot(date, timeSlot, false),
    onResync: () => load("resync"),
  });

  const goBack = () => navigation.goBack();

  if (loading) return <LoadingSpinner text="Loading profile..." />;
  if (error && !expert) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.topBar}><BackButton onPress={goBack} /></View>
        <ErrorState message={error} onRetry={() => load()} />
      </View>
    );
  }
  if (!expert) return null;

  const activeSlots = groups.find(([d]) => d === activeDate)?.[1] ?? [];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + SPACING.sm, paddingBottom: SPACING.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
      >
        <View style={styles.topBar}>
          <BackButton onPress={goBack} label="Back to experts" />
        </View>

        {/* Profile */}
        <View style={styles.section}>
          <View style={styles.profileRow}>
            <Avatar uri={expert.imageUrl} name={expert.name} size={72} radius={RADIUS.hero} />
            <View style={styles.profileText}>
              <Text style={TYPE.title} accessibilityRole="header">{expert.name}</Text>
              <Pill label={expert.category} />
            </View>
          </View>

          <View style={styles.stats}>
            <Stat
              value={Number(expert.rating).toFixed(1)}
              label="Rating"
              icon={<Ionicons name="star" size={15} color={COLORS.star} />}
            />
            <Stat value={`${expert.experience} yrs`} label="Experience" />
            <Stat value={formatPrice(expert.hourlyRate)} label="Per session" />
          </View>

          {!!expert.bio && (
            <View style={{ gap: 6 }}>
              <Text style={TYPE.eyebrow}>About</Text>
              <Text style={[TYPE.body, { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21 }]}>{expert.bio}</Text>
            </View>
          )}
        </View>

        {/* Availability */}
        <View style={styles.availHeader}>
          <Text style={TYPE.heading}>Availability</Text>
          {connected ? (
            <Pill label="Live" dot />
          ) : (
            <Pill label="Reconnecting…" dot fg={COLORS.warning} bg={COLORS.warningTint} />
          )}
        </View>

        {groups.length === 0 ? (
          <EmptyState
            icon="calendar-clear-outline"
            title="No upcoming availability"
            subtitle="New slots open every day — check back soon."
          />
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayStrip}>
              {groups.map(([date, slots]) => {
                const free = slots.filter((s) => !s.isBooked).length;
                const active = date === activeDate;
                const day = parseDateKey(date);
                return (
                  <Pressable
                    key={date}
                    onPress={() => setActiveDate(date)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`${formatDate(date, "day")}, ${free ? `${free} slots left` : "fully booked"}`}
                    style={[styles.dayTile, !free && styles.dayTileFull, active && styles.dayTileActive]}
                  >
                    <Text style={[styles.dayName, !free && styles.mutedText, active && styles.onAccent]}>
                      {day.toLocaleDateString("en-IN", { weekday: "short" })}
                    </Text>
                    <Text style={[styles.dayNum, !free && styles.mutedText, active && styles.onAccent]}>{day.getDate()}</Text>
                    <Text style={[styles.dayFree, !free && styles.mutedText, active && styles.onAccent]}>
                      {free ? `${free} left` : "Full"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.dateLabel}>{formatDate(activeDate, "day")}</Text>

            <View style={styles.slotGrid}>
              {activeSlots.map((slot) => {
                const isSelected = selected?.date === activeDate && selected?.time === slot.time;
                return (
                  <Pressable
                    key={slot.time}
                    disabled={slot.isBooked}
                    onPress={() => setSelected(isSelected ? null : { date: activeDate, time: slot.time })}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected, disabled: slot.isBooked }}
                    accessibilityLabel={`${slot.time}${slot.isBooked ? ", booked" : ""}`}
                    style={[
                      styles.slot,
                      { width: slotWidth },
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
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom bar — always present so the next step is obvious */}
      <View style={[styles.bar, { paddingBottom: insets.bottom + SPACING.md }]}>
        <View style={{ flex: 1 }}>
          <Text style={TYPE.bodyStrong} numberOfLines={1}>
            {selected ? `${formatDate(selected.date, "short")} · ${selected.time}` : "Pick a time"}
          </Text>
          <Text style={TYPE.small}>{formatPrice(expert.hourlyRate)} · 60 min</Text>
        </View>
        <Button
          title="Continue"
          icon="arrow-forward"
          disabled={!selected}
          style={{ height: 50 }}
          onPress={() =>
            navigation.navigate("Booking", {
              expertId: expert._id,
              expertName: expert.name,
              expertImage: expert.imageUrl,
              category: expert.category,
              hourlyRate: expert.hourlyRate,
              date: selected.date,
              timeSlot: selected.time,
            })
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  topBar: { paddingHorizontal: GUTTER, height: 44, flexDirection: "row", alignItems: "center" },
  section: { paddingHorizontal: GUTTER, paddingTop: SPACING.lg, gap: SPACING.lg },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  profileText: { flex: 1, gap: 6 },
  stats: { flexDirection: "row", gap: SPACING.sm },
  stat: {
    flex: 1,
    padding: SPACING.md,
    gap: 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
  },
  statValueRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statValue: { fontFamily: FONTS.extrabold, fontSize: 17, lineHeight: 22, color: COLORS.ink },
  availHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.xxl,
  },
  dayStrip: { paddingHorizontal: GUTTER, paddingTop: SPACING.md, gap: SPACING.sm },
  dayTile: {
    width: 58,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  dayTileFull: { backgroundColor: COLORS.lineSoft, borderColor: COLORS.lineSoft },
  dayTileActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayName: {
    fontFamily: FONTS.bold, fontSize: 11, lineHeight: 14,
    letterSpacing: 0.4, textTransform: "uppercase", color: COLORS.textMuted,
  },
  dayNum: { fontFamily: FONTS.extrabold, fontSize: 20, lineHeight: 26, color: COLORS.ink },
  dayFree: { fontFamily: FONTS.semibold, fontSize: 11, lineHeight: 14, color: COLORS.accent },
  mutedText: { color: COLORS.textMuted },
  onAccent: { color: "#fff" },
  dateLabel: {
    fontFamily: FONTS.bold, fontSize: 14, lineHeight: 20, color: COLORS.ink,
    paddingHorizontal: GUTTER, paddingTop: SPACING.lg, paddingBottom: SPACING.md,
  },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: SLOT_GAP, paddingHorizontal: GUTTER },
  slot: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.field,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  slotBooked: { backgroundColor: COLORS.lineSoft, borderColor: COLORS.lineSoft },
  slotSelected: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  slotText: { fontFamily: FONTS.semibold, fontSize: 14, color: COLORS.ink },
  slotTextBooked: { color: COLORS.textMuted, textDecorationLine: "line-through" },
  slotTextSelected: { fontFamily: FONTS.bold, color: "#fff" },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.lg,
    paddingHorizontal: GUTTER,
    paddingTop: 14,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    ...SHADOW.bar,
  },
});
