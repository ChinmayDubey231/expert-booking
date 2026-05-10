import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchExperts } from "../services/api";
import { COLORS, SPACING, RADIUS, SHADOW, CATEGORIES, CATEGORY_ICONS } from "../constants/theme";
import {
  Card, Badge, StarRating, LoadingSpinner, ErrorState, EmptyState, Button,
} from "../components/UI";

const LIMIT = 6;

export default function ExpertsScreen() {
  const router = useRouter();
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const searchTimeout = useRef(null);

  const loadExperts = useCallback(async (newPage = 1, reset = true) => {
    try {
      if (reset) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await fetchExperts({
        page: newPage,
        limit: LIMIT,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: search.trim() || undefined,
      });

      if (reset) {
        setExperts(res.data);
      } else {
        setExperts((prev) => [...prev, ...res.data]);
      }
      setPagination(res.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    setPage(1);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => loadExperts(1, true), 400);
    return () => clearTimeout(searchTimeout.current);
  }, [search, selectedCategory]);

  const handleLoadMore = () => {
    if (pagination?.hasNext && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadExperts(nextPage, false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadExperts(1, true);
  };

  const renderExpertCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push(`/expert/${item._id}`)}
    >
      <Card style={styles.expertCard}>
        <View style={styles.cardRow}>
          <Image
            source={{ uri: item.imageUrl || "https://via.placeholder.com/80" }}
            style={styles.avatar}
          />
          <View style={styles.cardInfo}>
            <Text style={styles.expertName}>{item.name}</Text>
            <Badge
              label={item.category}
              color={COLORS.primary}
            />
            <View style={styles.metaRow}>
              <StarRating rating={item.rating} />
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>{item.experience} yrs exp</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>₹{item.hourlyRate}/hr</Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.bioText} numberOfLines={2}>
            {item.bio}
          </Text>
          <View style={styles.bookBtn}>
            <Text style={styles.bookBtnText}>View & Book →</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={{ padding: 16, alignItems: "center" }}>
        <LoadingSpinner text="Loading more..." />
      </View>
    );
  };

  if (loading && !refreshing) return <LoadingSpinner text="Finding experts..." />;
  if (error && !experts.length)
    return <ErrorState message={error} onRetry={() => loadExperts(1, true)} />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipActive,
            ]}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat]}
              size={14}
              color={selectedCategory === cat ? "#fff" : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedCategory === cat && styles.filterChipTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Count */}
      {pagination && (
        <Text style={styles.resultsText}>
          {pagination.total} expert{pagination.total !== 1 ? "s" : ""} found
        </Text>
      )}

      {/* Expert List */}
      <FlatList
        data={experts}
        renderItem={renderExpertCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title="No experts found"
            subtitle="Try a different search or category filter"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  filterRow: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm, gap: 8 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  resultsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl, gap: 12 },
  expertCard: { gap: 10 },
  cardRow: { flexDirection: "row", gap: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.border,
  },
  cardInfo: { flex: 1, gap: 5 },
  expertName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  metaText: { fontSize: 12, color: COLORS.textSecondary },
  cardFooter: { gap: 8 },
  bioText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  bookBtn: {
    alignSelf: "flex-end",
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  bookBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
});
