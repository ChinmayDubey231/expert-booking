import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View, Text, FlatList, TextInput, StyleSheet,
  Pressable, RefreshControl, Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { cancelBooking, fetchBookingsByEmail } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import { COLORS, FONTS, GUTTER, RADIUS, SHADOW, SPACING, TYPE } from "../constants/theme";
import { bookingRef, formatDate, parseDateKey, slotStart } from "../utils/format";
import { Button, StatusBadge, LoadingSpinner, ErrorState, EmptyState } from "../components/UI";

const TABS = ["Upcoming", "Past", "Cancelled"];
const EMAIL_RE = /^\S+@\S+\.\S+$/;

const EMPTY_COPY = {
  Upcoming: { icon: "calendar-outline", title: "No upcoming sessions", subtitle: "Book a session with an expert and it will show up here." },
  Past: { icon: "time-outline", title: "No past sessions yet", subtitle: "Sessions you've had will appear here." },
  Cancelled: { icon: "close-circle-outline", title: "No cancelled bookings", subtitle: "Anything you cancel will be listed here." },
};

function tabOf(booking, now) {
  if (booking.status === "Cancelled") return "Cancelled";
  if (booking.status === "Completed") return "Past";
  return slotStart(booking.date, booking.timeSlot) > now ? "Upcoming" : "Past";
}

function DateBlock({ dateKey, muted }) {
  const d = parseDateKey(dateKey);
  return (
    <View style={[styles.dateBlock, muted && styles.dateBlockMuted]}>
      <Text style={[styles.dateMonth, muted && { color: COLORS.textMuted }]}>
        {d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}
      </Text>
      <Text style={styles.dateDay}>{d.getDate()}</Text>
      <Text style={styles.dateWeekday}>{d.toLocaleDateString("en-IN", { weekday: "short" })}</Text>
    </View>
  );
}

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile, ready, updateProfile, clearProfile } = useProfile();
  const email = profile.email;

  const [emailInput, setEmailInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null); // email the current list belongs to
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("Upcoming");
  const [cancellingId, setCancellingId] = useState(null);
  const requestIdRef = useRef(0);
  const loadedForRef = useRef(null);

  // mode: "initial" (spinner) | "refresh" (pull-to-refresh) | "silent" (tab re-focused)
  const load = useCallback(async (forEmail, mode) => {
    const requestId = ++requestIdRef.current;
    if (mode === "initial") {
      setLoading(true);
      setError(null);
    }
    if (mode === "refresh") setRefreshing(true);
    try {
      const res = await fetchBookingsByEmail(forEmail);
      if (requestId !== requestIdRef.current) return; // a newer lookup is in flight
      setBookings(res.data);
      setError(null);
      loadedForRef.current = forEmail;
      setLoadedFor(forEmail);
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      if (mode === "initial") setError(e.message);
      else if (mode === "refresh") Alert.alert("Couldn't refresh", e.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload whenever this tab comes into view, so a booking made a moment ago shows up
  useFocusEffect(
    useCallback(() => {
      if (email) load(email, loadedForRef.current === email ? "silent" : "initial");
    }, [email, load])
  );

  const grouped = useMemo(() => {
    const now = new Date();
    const out = { Upcoming: [], Past: [], Cancelled: [] };
    bookings.forEach((b) => out[tabOf(b, now)].push(b));
    const start = (b) => slotStart(b.date, b.timeSlot).getTime();
    out.Upcoming.sort((a, b) => start(a) - start(b)); // soonest first
    out.Past.sort((a, b) => start(b) - start(a)); // most recent first
    out.Cancelled.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return out;
  }, [bookings]);

  // ── Email ──────────────────────────────────────────────────────
  const inputValid = EMAIL_RE.test(emailInput.trim());

  const submitEmail = () => {
    const next = emailInput.trim().toLowerCase();
    if (!EMAIL_RE.test(next)) return;
    setEditing(false);
    // A new email re-runs the focus effect above, which loads it
    if (next === email) load(next, "initial");
    else updateProfile({ email: next });
  };

  const startEditing = () => {
    setEmailInput(email);
    setEditing(true);
  };

  const forgetDetails = () =>
    Alert.alert(
      "Forget saved details?",
      "Your name, email and phone will be removed from this device. Your bookings stay as they are.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Forget",
          style: "destructive",
          onPress: () => {
            clearProfile();
            setEditing(false);
            setEmailInput("");
            setBookings([]);
            setLoadedFor(null);
            loadedForRef.current = null;
          },
        },
      ]
    );

  // ── Actions ────────────────────────────────────────────────────
  const doCancel = async (booking) => {
    setCancellingId(booking._id);
    try {
      const res = await cancelBooking(booking._id, booking.email);
      setBookings((prev) => prev.map((b) => (b._id === booking._id ? res.data : b)));
    } catch (e) {
      Alert.alert("Couldn't cancel", e.message);
      load(email, "silent"); // it may have changed elsewhere
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancel = (booking) =>
    Alert.alert(
      "Cancel this session?",
      `${booking.expertName}\n${formatDate(booking.date, "short")} at ${booking.timeSlot}\n\nThe slot will be released for others to book.`,
      [
        { text: "Keep booking", style: "cancel" },
        { text: "Cancel session", style: "destructive", onPress: () => doCancel(booking) },
      ]
    );

  const bookAgain = (booking) =>
    navigation.navigate("ExpertDetail", { expertId: String(booking.expertId) });

  const renderItem = ({ item }) => {
    const cancelling = cancellingId === item._id;
    const upcoming = tab === "Upcoming";
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <DateBlock dateKey={item.date} muted={!upcoming} />
          <View style={styles.cardInfo}>
            <Text style={TYPE.bodyStrong} numberOfLines={1}>{item.expertName}</Text>
            <Text style={TYPE.small}>{item.timeSlot} · 60 min</Text>
            <StatusBadge status={item.status} small />
          </View>
        </View>
        {!!item.notes && (
          <Text style={[TYPE.small, styles.notes]} numberOfLines={2}>“{item.notes}”</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.ref}>#{bookingRef(item)}</Text>
          {upcoming ? (
            <Pressable
              onPress={() => confirmCancel(item)}
              disabled={cancelling}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Cancel session with ${item.expertName}`}
              style={({ pressed }) => [styles.cancelBtn, pressed && { backgroundColor: COLORS.dangerTint }]}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={COLORS.danger} />
              ) : (
                <Text style={styles.cancelText}>Cancel</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => bookAgain(item)}
              hitSlop={6}
              accessibilityRole="button"
              style={({ pressed }) => [styles.againBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.againText}>Book again</Text>
              <Ionicons name="chevron-forward" size={15} color={COLORS.accent} />
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  if (!ready) return <LoadingSpinner text="" />;

  const showEmailForm = !email || editing;
  const hasResults = !!email && loadedFor === email;
  const empty = EMPTY_COPY[tab];

  let body;
  if (!email) {
    body = (
      <EmptyState
        icon="mail-outline"
        title="See your sessions"
        subtitle="Enter the email you used while booking to view, cancel or rebook your sessions."
      />
    );
  } else if (error && !hasResults) {
    body = <ErrorState message={error} onRetry={() => load(email, "initial")} />;
  } else if (loading || !hasResults) {
    body = <LoadingSpinner text="Fetching your bookings..." />;
  } else {
    body = (
      <FlatList
        data={grouped[tab]}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(email, "refresh")}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
        ListEmptyComponent={
          <EmptyState icon={empty.icon} title={empty.title} subtitle={empty.subtitle}>
            {tab === "Upcoming" && (
              <Button
                title="Find an expert"
                size="sm"
                onPress={() => navigation.navigate("Experts")}
                style={{ marginTop: SPACING.lg }}
              />
            )}
          </EmptyState>
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={TYPE.display} accessibilityRole="header">My bookings</Text>

        {showEmailForm ? (
          <View style={styles.emailForm}>
            <Text style={styles.emailLabel}>Email used while booking</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.emailInput}
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="you@example.com"
                placeholderTextColor={COLORS.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                autoFocus={editing}
                returnKeyType="search"
                onSubmitEditing={submitEmail}
                accessibilityLabel="Email used while booking"
              />
              <Pressable
                style={[styles.searchBtn, !inputValid && styles.searchBtnDisabled]}
                onPress={submitEmail}
                disabled={!inputValid}
                accessibilityRole="button"
                accessibilityLabel="Find bookings"
              >
                <Ionicons name="arrow-forward" size={20} color={inputValid ? "#fff" : COLORS.textMuted} />
              </Pressable>
            </View>
            {editing && (
              <View style={styles.editActions}>
                <Pressable onPress={() => setEditing(false)} hitSlop={10} accessibilityRole="button">
                  <Text style={styles.linkText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={forgetDetails} hitSlop={10} accessibilityRole="button">
                  <Text style={[styles.linkText, { color: COLORS.danger }]}>Forget saved details</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emailRow}>
            <View style={styles.mailIcon}>
              <Ionicons name="mail-outline" size={18} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={TYPE.caption}>Showing bookings for</Text>
              <Text style={styles.emailText} numberOfLines={1}>{email}</Text>
            </View>
            <Pressable onPress={startEditing} style={styles.changeBtn} accessibilityRole="button">
              <Text style={styles.linkText}>Change</Text>
            </Pressable>
          </View>
        )}

        {hasResults && !loading && (
          <View style={styles.segments} accessibilityRole="tablist">
            {TABS.map((t) => {
              const active = tab === t;
              return (
                <Pressable
                  key={t}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => setTab(t)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{t}</Text>
                  <Text style={[styles.segmentCount, active && styles.segmentCountActive]}>
                    {grouped[t].length}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  header: { paddingHorizontal: GUTTER, gap: SPACING.lg },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    paddingVertical: 10,
    paddingLeft: SPACING.md,
    paddingRight: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 14,
  },
  mailIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.accentTint,
    alignItems: "center", justifyContent: "center",
  },
  emailText: { fontFamily: FONTS.bold, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  changeBtn: { height: 44, paddingHorizontal: SPACING.md, justifyContent: "center" },
  linkText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.accent },
  emailForm: {
    gap: SPACING.sm,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.card,
  },
  emailLabel: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary },
  inputRow: { flexDirection: "row", gap: 10 },
  emailInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    borderRadius: RADIUS.field,
    backgroundColor: COLORS.surface,
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.ink,
  },
  searchBtn: {
    width: 48, height: 48, borderRadius: RADIUS.field,
    backgroundColor: COLORS.accent, alignItems: "center", justifyContent: "center",
  },
  searchBtnDisabled: { backgroundColor: COLORS.lineSoft },
  editActions: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  segments: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: RADIUS.field,
    backgroundColor: COLORS.segment,
  },
  segment: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 9,
  },
  segmentActive: { backgroundColor: COLORS.surface, ...SHADOW.raised },
  segmentText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.textSecondary },
  segmentTextActive: { fontFamily: FONTS.bold, color: COLORS.ink },
  segmentCount: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textSecondary },
  segmentCountActive: {
    minWidth: 20,
    paddingHorizontal: 6,
    lineHeight: 20,
    borderRadius: 10,
    overflow: "hidden",
    textAlign: "center",
    fontFamily: FONTS.extrabold,
    color: COLORS.accent,
    backgroundColor: COLORS.accentTint,
  },
  list: { padding: GUTTER, paddingTop: SPACING.lg, gap: SPACING.md, flexGrow: 1 },
  card: {
    gap: SPACING.md,
    padding: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.card,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  cardInfo: { flex: 1, minWidth: 0, gap: 4 },
  dateBlock: {
    width: 56,
    height: 64,
    borderRadius: RADIUS.field,
    backgroundColor: COLORS.accentTint,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBlockMuted: { backgroundColor: COLORS.lineSoft },
  dateMonth: { fontFamily: FONTS.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6, color: COLORS.accent },
  dateDay: { fontFamily: FONTS.extrabold, fontSize: 22, lineHeight: 26, color: COLORS.ink },
  dateWeekday: { fontFamily: FONTS.semibold, fontSize: 11, lineHeight: 14, color: COLORS.textSecondary },
  notes: { fontFamily: FONTS.regular },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  ref: {
    fontFamily: FONTS.semibold, fontSize: 12, letterSpacing: 0.4,
    color: COLORS.textMuted, fontVariant: ["tabular-nums"],
  },
  cancelBtn: {
    minWidth: 76,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.dangerLine,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.danger },
  againBtn: { height: 36, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: SPACING.sm },
  againText: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.accent },
});
