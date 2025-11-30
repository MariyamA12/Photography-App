// src/screens/EventsScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import usePaginatedEvents from "../hooks/usePaginatedEvents";
import FilterBar from "../components/FilterBar";
import EventCard from "../components/EventCard";
import BottomNavigation from "../components/BottomNavigation";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";
import { textStyles } from "../utils/typography";
import { fetchSchools } from "../api/schools";

export default function EventsScreen({ navigation }) {
  const initial = {
    search: "",
    school_id: null,
    start_date: null,
    end_date: null,
    sort_asc: true,
    includeExpired: false,
  };
  const [filters, setFilters] = useState(initial);
  const [activeTab, setActiveTab] = useState("events");

  const {
    events = [],
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePaginatedEvents(filters, 10);

  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];

  const [schools, setSchools] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchSchools();
        setSchools(Array.isArray(list) ? list : []);
      } catch {
        setSchools([]);
      }
    })();
  }, []);

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === "notifications") {
      navigation.navigate("Notifications");
    } else if (tabKey === "profile") {
      navigation.navigate("Profile");
    }
  };

  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <LinearGradient
          colors={[Colors.primaryMuted, Colors.background]} // Now coral light to white
          style={styles.emptyStateGradient}
        >
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Colors.textTertiary}
            />
          </View>
          <Text style={[styles.emptyTitle, textStyles.heading2]}>
            No events found
          </Text>
          <Text style={[styles.emptySubtitle, textStyles.bodyMedium]}>
            {filters.search ||
            filters.school_id ||
            filters.start_date ||
            filters.end_date
              ? "Try adjusting your filters or search terms"
              : "There are no events scheduled at the moment"}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]} // Now coral to dark coral
              style={styles.refreshButtonGradient}
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.white} />
              <Text
                style={[
                  styles.refreshButtonText,
                  textStyles.buttonMedium,
                  styles.fallbackText,
                ]}
              >
                Refresh
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  // Add error boundary for rendering events
  const renderEventItem = ({ item }) => {
    try {
      if (!item || !item.id || !item.event_date) {
        console.warn("EventsScreen: Invalid event item", { item });
        return null;
      }

      const handlePress = () => {
        navigation.navigate("QRScanner", { event: item });
      };

      const handleArrowPress = () => {
        navigation.navigate("EventDetails", { eventId: item.id });
      };

      return (
        <EventCard
          event={item}
          onPress={handlePress}
          onArrowPress={handleArrowPress}
        />
      );
    } catch (error) {
      console.error("EventsScreen: Error rendering event item", error, {
        item,
      });
      return null;
    }
  };

  const renderErrorState = () => {
    return (
      <View style={styles.errorState}>
        <LinearGradient
          colors={[Colors.errorLight, Colors.background]} // Now coral light to white
          style={styles.errorStateGradient}
        >
          <View style={styles.errorIconContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={Colors.error}
            />
          </View>
          <Text style={[styles.errorTitle, textStyles.heading2]}>
            Something went wrong
          </Text>
          <Text style={[styles.errorSubtitle, textStyles.bodyMedium]}>
            We couldn't load your events. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              style={styles.retryButtonGradient}
            >
              <Ionicons name="refresh-outline" size={20} color={Colors.white} />
              <Text style={[styles.retryButtonText, textStyles.buttonMedium]}>
                Try Again
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  const renderLoadingState = () => {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, textStyles.bodyMedium]}>
          Loading events...
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.loadMoreButtonGradient}
        >
          <Text
            style={[
              styles.loadMoreButtonText,
              textStyles.buttonMedium,
              styles.fallbackText,
            ]}
          >
            Load More Events
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Show error state if there's an error and not loading
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderErrorState()}
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FilterBar
        schools={schools}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        onSchoolChange={(school_id) => setFilters({ ...filters, school_id })}
        onDateRangeChange={({ start, end }) =>
          setFilters({ ...filters, start_date: start, end_date: end })
        }
        onSortToggle={() =>
          setFilters({ ...filters, sort_asc: !filters.sort_asc })
        }
        onIncludeExpiredToggle={() =>
          setFilters({ ...filters, includeExpired: !filters.includeExpired })
        }
        onClearFilters={() => setFilters(initial)}
        includeExpired={filters.includeExpired}
        sortAsc={filters.sort_asc}
      />

      {loading && safeEvents.length === 0 ? (
        renderLoadingState()
      ) : (
        <FlatList
          data={safeEvents.filter((event) => event && event.event_date)} // Filter out invalid events
          keyExtractor={(item) =>
            item && item.id ? item.id.toString() : `event-${Math.random()}`
          }
          renderItem={renderEventItem}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={loading && safeEvents.length > 0}
              onRefresh={refresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Header container
  headerContainer: {
    backgroundColor: Colors.primaryMuted,
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.textPrimary,
    textAlign: "center",
  },
  testText: {
    color: Colors.textPrimary,
    marginTop: spacing.md,
    textAlign: "center",
  },
  debugText: {
    color: Colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: spacing.xl,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing["3xl"],
  },
  emptyStateGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    width: "100%",
    ...shadows.md,
  },
  emptyIconContainer: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  refreshButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  refreshButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  refreshButtonText: {
    color: Colors.white,
  },
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    marginTop: spacing["3xl"],
  },
  errorStateGradient: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    width: "100%",
    ...shadows.md,
  },
  errorIconContainer: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    color: Colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  errorSubtitle: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  retryButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  retryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: spacing.md,
  },
  footerLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  footerLoadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loadMoreButton: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  loadMoreButtonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  loadMoreButtonText: {
    color: Colors.white,
  },
  topTestContainer: {
    backgroundColor: Colors.primaryMuted,
    padding: spacing.md,
    margin: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    marginTop: spacing.xl, // Add some space above the header
  },
  topTestText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});
