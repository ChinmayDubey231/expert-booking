import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet,
  TouchableOpacity, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchBookingsByEmail } from "../services/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import { Card, StatusBadge, LoadingSpinner, ErrorState, EmptyState, Button } from "../components/UI";

const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const statusOrder = { Pending: 0, Confirmed: 1, Completed: 2, Cancelled: 3 };

export default function MyBookingsScreen() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const isValidEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const handleSearch = async (isRefresh = false) => {
    if (!isValidEmail) return;
    const emailToSearch = email.trim().toLowerCase();

    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const res = await fetchBookingsByEmail(emailToSearch);
      setBookings(res.data.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]));
      setSubmittedEmail(emailToSearch);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderBooking = ({ item }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.expertInfo}>
          <Ionicons name="person-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.expertName}>{item.expertName}</Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.bookingDetails}>
        <DetailRow icon="calendar-outline" label="Date" value={formatDate(item.date)} />
        <DetailRow icon="time-outline" label="Time" value={item.timeSlot} />
        <DetailRow icon="person-outline" label="Name" value={item.userName} />
        {item.notes ? (
          <DetailRow icon="document-text-outline" label="Notes" value={item.notes} />
        ) : null}
      </View>

      <View style={styles.bookingFooter}>
        <Text style={styles.bookingId}>
          Booking #{item._id?.slice(-8).toUpperCase()}
        </Text>
        <Text style={styles.bookingDate}>
          Booked {new Date(item.createdAt).toLocaleDateString("en-IN")}
        </Text>
      </View>
    </Card>
  );

  const DetailRow = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  // Count by status
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Email search */}
      <View style={styles.searchSection}>
        <Text style={styles.searchTitle}>Find Your Bookings</Text>
        <Text style={styles.searchSubtitle}>Enter the email used while booking</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
          />
          <TouchableOpacity
            style={[styles.searchBtn, !isValidEmail && styles.searchBtnDisabled]}
            disabled={!isValidEmail || loading}
            onPress={() => handleSearch()}
          >
            <Ionicons
              name={loading ? "time-outline" : "search-outline"}
              size={20}
              color={isValidEmail ? "#fff" : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading state */}
      {loading && <LoadingSpinner text="Fetching your bookings..." />}

      {/* Error */}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => handleSearch()} />
      )}

      {/* Results */}
      {!loading && searched && !error && (
        <>
          {/* Stats strip */}
          {bookings.length > 0 && (
            <View style={styles.statsStrip}>
              <Text style={styles.statsTotal}>{bookings.length} booking{bookings.length !== 1 ? "s" : ""}</Text>
              {Object.entries(counts).map(([status, count]) => (
                <View key={status} style={styles.statItem}>
                  <Text style={styles.statCount}>{count}</Text>
                  <Text style={styles.statLabel}>{status}</Text>
                </View>
              ))}
            </View>
          )}

          <FlatList
            data={bookings}
            renderItem={renderBooking}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => handleSearch(true)}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="📅"
                title="No bookings found"
                subtitle={`No sessions found for ${submittedEmail}. Book a session with an expert to get started.`}
              />
            }
          />
        </>
      )}

      {/* Initial prompt */}
      {!loading && !searched && !error && (
        <View style={styles.initialPrompt}>
          <Text style={styles.promptIcon}>📬</Text>
          <Text style={styles.promptText}>
            Enter your email address to view all your booked expert sessions.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchSection: {
    backgroundColor: COLORS.secondary,
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    gap: 6,
  },
  searchTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  searchSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 10 },
  emailInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    width: 48, height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center", justifyContent: "center",
  },
  searchBtnDisabled: { backgroundColor: COLORS.border },
  statsStrip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    gap: 12,
  },
  statsTotal: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary, flex: 1 },
  statItem: { alignItems: "center", gap: 2 },
  statCount: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  listContent: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  bookingCard: { gap: 10 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  expertInfo: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  expertName: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  divider: { height: 1, backgroundColor: COLORS.borderLight },
  bookingDetails: { gap: 7 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, width: 40 },
  detailValue: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "500", flex: 1 },
  bookingFooter: {
    flexDirection: "row", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 8,
  },
  bookingId: { fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace" },
  bookingDate: { fontSize: 11, color: COLORS.textMuted },
  initialPrompt: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: SPACING.xl, gap: 12,
  },
  promptIcon: { fontSize: 56 },
  promptText: {
    fontSize: 15, color: COLORS.textSecondary, textAlign: "center", lineHeight: 22,
  },
});
