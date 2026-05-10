import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchBookingsByEmail } from "../services/api";
import { COLORS, SPACING, RADIUS, SHADOW } from "../constants/theme";
import {
  Card,
  StatusBadge,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../components/UI";

function fmtDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={13} color={COLORS.textMuted} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export default function MyBookingsScreen() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  async function doSearch(isRefresh = false) {
    if (!validEmail) return;
    const q = email.trim().toLowerCase();
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetchBookingsByEmail(q);
      setBookings(res.data);
      setLastEmail(q);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const renderItem = ({ item }) => (
    <Card style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.expertName} numberOfLines={1}>
          {item.expertName}
        </Text>
        <StatusBadge status={item.status} />
      </View>
      <View style={styles.divider} />
      <View style={styles.details}>
        <DetailRow
          icon="calendar-outline"
          label="Date"
          value={fmtDate(item.date)}
        />
        <DetailRow icon="time-outline" label="Time" value={item.timeSlot} />
        <DetailRow icon="person-outline" label="Name" value={item.userName} />
        {item.notes ? (
          <DetailRow
            icon="document-text-outline"
            label="Notes"
            value={item.notes}
          />
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.ref}>#{item._id?.slice(-8).toUpperCase()}</Text>
        <Text style={styles.createdAt}>
          {new Date(item.createdAt).toLocaleDateString("en-IN")}
        </Text>
      </View>
    </Card>
  );

  // Summary counts
  const counts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Email search header */}
      <View style={styles.header}>
        <Text style={styles.headerSub}>Enter the email used while booking</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={() => doSearch()}
          />
          <TouchableOpacity
            style={[styles.searchBtn, !validEmail && styles.searchBtnDisabled]}
            onPress={() => doSearch()}
            disabled={!validEmail || loading}
          >
            <Ionicons
              name="search"
              size={19}
              color={validEmail ? "#fff" : COLORS.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* States */}
      {loading && <LoadingSpinner text="Fetching your bookings..." />}
      {!loading && error && (
        <ErrorState message={error} onRetry={() => doSearch()} />
      )}

      {!loading && searched && !error && (
        <>
          {/* Stats */}
          {bookings.length > 0 && (
            <View style={styles.statsRow}>
              <Text style={styles.statsTotal}>
                {bookings.length} booking{bookings.length !== 1 ? "s" : ""}
              </Text>
              {Object.entries(counts).map(([status, count]) => (
                <View key={status} style={styles.statBadge}>
                  <Text style={styles.statCount}>{count}</Text>
                  <Text style={styles.statLabel}>{status}</Text>
                </View>
              ))}
            </View>
          )}

          <FlatList
            data={bookings}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => doSearch(true)}
                tintColor={COLORS.primary}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="📅"
                title="No bookings found"
                subtitle={`Nothing found for ${lastEmail}`}
              />
            }
          />
        </>
      )}

      {!loading && !searched && !error && (
        <View style={styles.prompt}>
          <Text style={{ fontSize: 52 }}>📬</Text>
          <Text style={styles.promptText}>
            Enter your email address to view all your booked sessions.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: 6,
  },
  headerSub: { fontSize: 13, color: "#94A3B8", marginBottom: 6 },
  inputRow: { flexDirection: "row", gap: 10 },
  emailInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: RADIUS.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnDisabled: { backgroundColor: COLORS.border },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsTotal: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  statBadge: { alignItems: "center" },
  statCount: { fontSize: 15, fontWeight: "800", color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textMuted },
  list: { padding: SPACING.md, gap: 12, paddingBottom: 40 },
  bookingCard: { gap: 10 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expertName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  divider: { height: 1, backgroundColor: COLORS.borderLight },
  details: { gap: 7 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  detailLabel: { fontSize: 12, color: COLORS.textMuted, width: 38 },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textPrimary,
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  ref: { fontSize: 11, color: COLORS.textMuted },
  createdAt: { fontSize: 11, color: COLORS.textMuted },
  prompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: SPACING.xl,
  },
  promptText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
