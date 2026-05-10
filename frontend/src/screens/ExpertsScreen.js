import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchExperts } from "../services/api";
import {
  COLORS,
  SPACING,
  RADIUS,
  CATEGORIES,
  CATEGORY_ICONS,
} from "../constants/theme";
import {
  Card,
  Badge,
  StarRating,
  LoadingSpinner,
  ErrorState,
  EmptyState,
} from "../components/UI";

const LIMIT = 6;

export default function ExpertsScreen({ navigation }) {
  const [experts, setExperts] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const debounceRef = useRef(null);
  // Refs so loadExperts never re-creates due to state deps
  const searchRef = useRef("");
  const categoryRef = useRef("All");

  const loadExperts = useCallback(
    async (newPage, resetList, isInitial = false) => {
      const q = searchRef.current;
      const cat = categoryRef.current;
      try {
        if (isInitial) setInitialLoading(true);
        else if (!resetList) setLoadingMore(true);
        setError(null);

        const res = await fetchExperts({
          page: newPage,
          limit: LIMIT,
          category: cat !== "All" ? cat : undefined,
          search: q.trim() || undefined,
        });

        setExperts((prev) => (resetList ? res.data : [...prev, ...res.data]));
        setPagination(res.pagination);
        setPage(newPage);
      } catch (e) {
        setError(e.message);
      } finally {
        setInitialLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadExperts(1, true, true);
  }, [loadExperts]);

  const onSearchChange = (text) => {
    setSearch(text);
    searchRef.current = text;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadExperts(1, true, false); // no full spinner on search
    }, 400);
  };

  const onCategoryChange = (cat) => {
    setCategory(cat);
    categoryRef.current = cat;
    loadExperts(1, true, false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExperts(1, true, false);
  };

  const onEndReached = () => {
    if (pagination?.hasNext && !loadingMore && !initialLoading) {
      loadExperts(page + 1, false, false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() =>
        navigation.navigate("ExpertDetail", { expertId: item._id })
      }
    >
      <Card style={styles.card}>
        <View style={styles.cardTop}>
          <Image
            source={{
              uri:
                item.imageUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=2563EB&color=fff&size=120`,
            }}
            style={styles.avatar}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Badge label={item.category} color={COLORS.primary} />
            <View style={styles.metaRow}>
              <StarRating rating={item.rating} />
              <Text style={styles.dot}>·</Text>
              <Text style={styles.meta}>{item.experience} yrs</Text>
              <Text style={styles.dot}>·</Text>
              <Text
                style={[
                  styles.meta,
                  { color: COLORS.accent, fontWeight: "700" },
                ]}
              >
                ₹{item.hourlyRate}/hr
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.bio} numberOfLines={2}>
          {item.bio}
        </Text>
        <View style={styles.viewBtn}>
          <Text style={styles.viewBtnText}>View & Book →</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (initialLoading) return <LoadingSpinner text="Finding experts..." />;
  if (error && !experts.length)
    return (
      <ErrorState message={error} onRetry={() => loadExperts(1, true, true)} />
    );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={17} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange("")}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 4, flexGrow: 0 }}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onCategoryChange(cat)}
            style={[styles.chip, category === cat && styles.chipActive]}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat]}
              size={12}
              color={category === cat ? "#fff" : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.chipText,
                category === cat && styles.chipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {pagination && (
        <Text style={styles.countText}>
          {pagination.total} expert{pagination.total !== 1 ? "s" : ""}
        </Text>
      )}

      <FlatList
        style={{ flex: 1 }}
        data={experts}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListFooterComponent={loadingMore ? <LoadingSpinner text="" /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="No experts found"
            subtitle="Try a different name or category"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  filterRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    height: 34,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  chipTextActive: { color: "#fff" },
  countText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginBottom: 6,
  },
  list: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, gap: 12 },
  card: { gap: 10 },
  cardTop: { flexDirection: "row", gap: 12 },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  cardInfo: { flex: 1, gap: 5 },
  name: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { color: COLORS.textMuted, fontSize: 12 },
  meta: { fontSize: 12, color: COLORS.textSecondary },
  bio: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  viewBtn: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  viewBtnText: { fontSize: 12, fontWeight: "700", color: COLORS.primary },
});
