import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, SectionList, Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchExpertById } from "../../services/api";
import useSocket from "../../hooks/useSocket";
import { COLORS, SPACING, RADIUS, SHADOW } from "../../constants/theme";
import { Card, Badge, StarRating, LoadingSpinner, ErrorState, Button } from "../../components/UI";

// Group slots by date for SectionList
const groupSlotsByDate = (slots) => {
  const grouped = {};
  slots.forEach((slot) => {
    if (!grouped[slot.date]) grouped[slot.date] = [];
    grouped[slot.date].push(slot);
  });

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .map(([date, data]) => ({
      title: date,
      data: [data], // SectionList row = array of slots for that date
    }));
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short",
  });
};

export default function ExpertDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sections, setSections] = useState([]);

  const loadExpert = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchExpertById(id);
      setExpert(res.data);
      setSections(groupSlotsByDate(res.data.availableSlots));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadExpert(); }, [loadExpert]);

  // Real-time socket updates
  const handleSlotBooked = useCallback(({ date, timeSlot }) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.title !== date) return section;
        return {
          ...section,
          data: [section.data[0].map((slot) =>
            slot.time === timeSlot ? { ...slot, isBooked: true } : slot
          )],
        };
      })
    );
    // Deselect if this slot was selected
    setSelectedSlot((prev) => {
      if (prev?.date === date && prev?.time === timeSlot) {
        Alert.alert("Slot Taken", "This slot was just booked by someone else. Please choose another.");
        return null;
      }
      return prev;
    });
  }, []);

  const handleSlotFreed = useCallback(({ date, timeSlot }) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.title !== date) return section;
        return {
          ...section,
          data: [section.data[0].map((slot) =>
            slot.time === timeSlot ? { ...slot, isBooked: false } : slot
          )],
        };
      })
    );
  }, []);

  useSocket(id, handleSlotBooked, handleSlotFreed);

  if (loading) return <LoadingSpinner text="Loading expert profile..." />;
  if (error) return <ErrorState message={error} onRetry={loadExpert} />;
  if (!expert) return null;

  const renderSlotRow = ({ item: slots, section }) => (
    <View style={styles.slotGrid}>
      {slots.map((slot) => {
        const isSelected =
          selectedSlot?.date === section.title && selectedSlot?.time === slot.time;
        return (
          <TouchableOpacity
            key={slot.time}
            disabled={slot.isBooked}
            onPress={() =>
              setSelectedSlot(
                isSelected ? null : { date: section.title, time: slot.time }
              )
            }
            style={[
              styles.slotChip,
              slot.isBooked && styles.slotBooked,
              isSelected && styles.slotSelected,
            ]}
          >
            <Text
              style={[
                styles.slotTime,
                slot.isBooked && styles.slotTimeBooked,
                isSelected && styles.slotTimeSelected,
              ]}
            >
              {slot.time}
            </Text>
            {slot.isBooked && (
              <Text style={styles.bookedLabel}>Booked</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Profile */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: expert.imageUrl || "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{expert.name}</Text>
        <Badge label={expert.category} color={COLORS.primary} />
        <View style={styles.metaRow}>
          <StarRating rating={expert.rating} />
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{expert.experience} yrs exp</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={[styles.metaText, { color: COLORS.accent, fontWeight: "700" }]}>
            ₹{expert.hourlyRate}/hr
          </Text>
        </View>
        <Text style={styles.bio}>{expert.bio}</Text>
      </View>

      {/* Real-time indicator */}
      <View style={styles.realtimeBadge}>
        <View style={styles.liveIndicator} />
        <Text style={styles.realtimeText}>Slot availability updates in real-time</Text>
      </View>

      {/* Slot Selection */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => String(index)}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>{formatDate(section.title)}</Text>
          </View>
        )}
        renderItem={renderSlotRow}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      {/* Sticky Book CTA */}
      {selectedSlot && (
        <View style={styles.bookingBar}>
          <View>
            <Text style={styles.selectedSlotLabel}>Selected slot</Text>
            <Text style={styles.selectedSlotText}>
              {formatDate(selectedSlot.date)} · {selectedSlot.time}
            </Text>
          </View>
          <Button
            title="Book Now"
            onPress={() =>
              router.push({
                pathname: `/booking/${expert._id}`,
                params: {
                  expertName: expert.name,
                  date: selectedSlot.date,
                  timeSlot: selectedSlot.time,
                },
              })
            }
            size="sm"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  profileHeader: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 3, borderColor: COLORS.primary,
  },
  name: { fontSize: 22, fontWeight: "800", color: COLORS.textPrimary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaDot: { color: COLORS.textMuted },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  bio: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: "center",
    lineHeight: 20, paddingHorizontal: SPACING.sm,
  },
  realtimeBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 8,
    backgroundColor: "#ECFDF5",
  },
  liveIndicator: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  realtimeText: { fontSize: 12, color: COLORS.accent, fontWeight: "600" },
  listContent: { padding: SPACING.md, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: SPACING.md, marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    minWidth: 90,
  },
  slotBooked: { backgroundColor: COLORS.borderLight, borderColor: COLORS.border },
  slotSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotTime: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary },
  slotTimeBooked: { color: COLORS.textMuted, textDecorationLine: "line-through" },
  slotTimeSelected: { color: "#fff" },
  bookedLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  bookingBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    ...SHADOW.md,
  },
  selectedSlotLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "500" },
  selectedSlotText: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
});
