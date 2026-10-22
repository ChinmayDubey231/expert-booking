import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TextInput, Pressable,
  StyleSheet, ScrollView, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fetchExperts } from "../services/api";
import { useProfile } from "../context/ProfileContext";
import { COLORS, FONTS, GUTTER, RADIUS, SPACING, TYPE, CATEGORIES, CATEGORY_ICONS } from "../constants/theme";
import { formatPrice, greeting } from "../utils/format";
import { Avatar, StarRating, LoadingSpinner, ErrorState, EmptyState } from "../components/UI";

const LIMIT = 6;

function ExpertCard({ expert, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expert.name}, ${expert.category}, ${formatPrice(expert.hourlyRate)} per session`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardTop}>
        <Avatar uri={expert.imageUrl} name={expert.name} size={56} radius={14} />
        <View style={styles.cardInfo}>
          <Text style={styles.name} numberOfLines={1}>{expert.name}</Text>
          <Text style={TYPE.small} numberOfLines={1}>
            {expert.category} · {expert.experience} yrs exp
          </Text>
          <StarRating rating={expert.rating} />
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.price}>{formatPrice(expert.hourlyRate)}</Text>
          <Text style={TYPE.caption}>per session</Text>
        </View>
      </View>
      {!!expert.bio && (
        <Text style={[TYPE.small, styles.bio]} numberOfLines={2}>{expert.bio}</Text>
      )}
      <View style={styles.cardFooter}>
        <Text style={styles.viewProfile}>View profile</Text>
        <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
      </View>
    </Pressable>
  );
}

export default function ExpertsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();
  const [experts, setExperts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [pagination, setPagination] = useState(null);
  // Filters behind the results currently on screen — "load more" must reuse these,
  // not whatever is half-typed in the search box
  const [applied, setApplied] = useState({ query: "", cat: "All" });
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  // mode: "initial" | "filter" | "refresh" | "more"
  const load = useCallback(async ({ page = 1, mode, query, cat }) => {
    const requestId = ++requestIdRef.current;
    setError(null);
    if (mode === "filter") setSearching(true);
    if (mode === "more") setLoadingMore(true);

    try {
      const res = await fetchExperts({
        page,
        limit: LIMIT,
        category: cat !== "All" ? cat : undefined,
        search: query.trim() || undefined,
      });
      if (requestId !== requestIdRef.current) return; // superseded by a newer search
      setExperts((prev) => (page === 1 ? res.data : [...prev, ...res.data]));
      setPagination(res.pagination);
      setApplied({ query, cat });
    } catch (e) {
      if (requestId === requestIdRef.current) setError(e.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setSearching(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load({ mode: "initial", query: "", cat: "All" });
    return () => clearTimeout(debounceRef.current);
  }, [load]);

  const onSearchChange = (text) => {
    setSearch(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      load({ mode: "filter", query: text, cat: category });
    }, 400);
  };

  const onCategoryChange = (cat) => {
    if (cat === category) return;
    setCategory(cat);
    clearTimeout(debounceRef.current);
    load({ mode: "filter", query: search, cat });
  };

  const onRefresh = () => {
    setRefreshing(true);
    load({ mode: "refresh", query: search, cat: category });
  };

  const onEndReached = () => {
    if (pagination?.hasNext && !loadingMore && !searching && !refreshing) {
      load({ page: pagination.page + 1, mode: "more", ...applied });
    }
  };

  // Full-screen spinner only before the first response. After that the search bar must
  // stay mounted, or the keyboard closes mid-typing every time results reload.
  if (initialLoading) return <LoadingSpinner text="Finding experts..." />;

  const retry = () => load({ mode: "filter", query: search, cat: category });
  const firstName = profile.userName.trim().split(/\s+/)[0];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={styles.greeting}>
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </Text>
        <Text style={TYPE.display} accessibilityRole="header">Find the right expert</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchIcon} pointerEvents="none">
          {searching ? (
            <ActivityIndicator size="small" color={COLORS.accent} />
          ) : (
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
          )}
        </View>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or skill"
          placeholderTextColor={COLORS.placeholder}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search experts"
        />
        {search.length > 0 && (
          <Pressable
            onPress={() => onSearchChange("")}
            hitSlop={10}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => onCategoryChange(cat)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Ionicons name={CATEGORY_ICONS[cat]} size={16} color={active ? "#fff" : COLORS.textSecondary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {pagination && !(error && !experts.length) && (
        <Text style={styles.countText}>
          {pagination.total} expert{pagination.total !== 1 ? "s" : ""}
        </Text>
      )}

      {error && experts.length > 0 && (
        <Pressable style={styles.inlineError} onPress={retry} accessibilityRole="button">
          <Ionicons name="cloud-offline-outline" size={16} color={COLORS.danger} />
          <Text style={styles.inlineErrorText} numberOfLines={2}>
            Couldn't update results. Tap to retry.
          </Text>
        </Pressable>
      )}

      <FlatList
        data={experts}
        renderItem={({ item }) => (
          <ExpertCard
            expert={item}
            onPress={() => navigation.navigate("ExpertDetail", { expertId: item._id })}
          />
        )}
        keyExtractor={(item) => item._id}
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={{ padding: SPACING.lg }} color={COLORS.accent} /> : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} colors={[COLORS.accent]} />
        }
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No experts found"
              subtitle="Try a different name, skill or category."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ground },
  header: { paddingHorizontal: GUTTER, gap: 4 },
  greeting: { fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 18, color: COLORS.textMuted },
  searchWrap: {
    marginTop: SPACING.lg,
    marginHorizontal: GUTTER,
    justifyContent: "center",
  },
  searchIcon: { position: "absolute", left: 14, zIndex: 1, width: 20, alignItems: "center" },
  searchInput: {
    height: 48,
    paddingLeft: 44,
    paddingRight: 40,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.button,
    backgroundColor: COLORS.surface,
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.ink,
  },
  clearBtn: { position: "absolute", right: 14 },
  // ScrollView defaults to flexShrink: 1 — without 0 here the long list below squeezes the chips
  filterScroll: { flexGrow: 0, flexShrink: 0, marginTop: 14 },
  filterRow: { paddingHorizontal: GUTTER, gap: SPACING.sm },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipText: { fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.textSecondary },
  chipTextActive: { fontFamily: FONTS.bold, color: "#fff" },
  countText: {
    fontFamily: FONTS.semibold, fontSize: 13, lineHeight: 18, color: COLORS.textMuted,
    paddingHorizontal: GUTTER, paddingTop: SPACING.xl, paddingBottom: 10,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginHorizontal: GUTTER,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.field,
    backgroundColor: COLORS.dangerTint,
  },
  inlineErrorText: { flex: 1, fontFamily: FONTS.semibold, fontSize: 13, color: COLORS.danger },
  list: { paddingHorizontal: GUTTER, paddingBottom: SPACING.xxxl, gap: SPACING.md, flexGrow: 1 },
  card: {
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADIUS.card,
  },
  cardPressed: { backgroundColor: COLORS.surfaceSunken, borderColor: COLORS.accent },
  cardTop: { flexDirection: "row", gap: SPACING.md, alignItems: "flex-start" },
  cardInfo: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: FONTS.bold, fontSize: 16, lineHeight: 22, color: COLORS.ink },
  priceCol: { alignItems: "flex-end" },
  price: { fontFamily: FONTS.extrabold, fontSize: 16, lineHeight: 22, color: COLORS.ink },
  bio: { lineHeight: 19 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 2,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lineSoft,
  },
  viewProfile: { fontFamily: FONTS.bold, fontSize: 13, color: COLORS.accent },
});
