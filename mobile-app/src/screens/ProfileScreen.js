// src/screens/ProfileScreen.js

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import BottomNavigation from "../components/BottomNavigation";
import { useAuth } from "../contexts/AuthContext";
import Colors from "../utils/colors";
import { textStyles } from "../utils/typography";
import { spacing, borderRadius, shadows } from "../utils/spacing";
import api from "../api/axios";

export default function ProfileScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    completedEvents: 0,
    upcomingEvents: 0,
    totalAttendance: 0,
    totalPhotos: 0,
  });
  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/photographer/profile");
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // If profile fetch fails, use the user data from auth context
      if (user) {
        setUserProfile({
          userId: user.id,
          role: user.role,
          name: user.name,
          email: user.email,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch events to get statistics
      const { data: eventsData } = await api.get(
        "/photographer/events?limit=1000"
      );

      if (eventsData?.data) {
        const now = new Date();
        const totalEvents = eventsData.data.length;
        const completedEvents = eventsData.data.filter(
          (event) => new Date(event.event_date) < now && event.is_finished
        ).length;
        const upcomingEvents = eventsData.data.filter(
          (event) => new Date(event.event_date) >= now
        ).length;

        // Calculate total attendance and photos (placeholder - would need actual API endpoints)
        const totalAttendance = eventsData.data.reduce(
          (sum, event) => sum + (event.attendance_count || 0),
          0
        );
        const totalPhotos = eventsData.data.reduce(
          (sum, event) => sum + (event.photo_count || 0),
          0
        );

        setStats({
          totalEvents,
          completedEvents,
          upcomingEvents,
          totalAttendance,
          totalPhotos,
        });
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUserProfile(), fetchUserStats()]);
    setRefreshing(false);
  };

  const handleTabPress = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === "events") {
      navigation.navigate("Home");
    } else if (tabKey === "notifications") {
      navigation.navigate("Notifications");
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Yes", onPress: signOut },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const renderStatCard = (title, value, icon, color = Colors.primary) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={[Colors.white, Colors.background]}
        style={styles.statGradient}
      >
        <View style={styles.statIconContainer}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{title}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderInfoRow = (label, value, icon, iconColor = Colors.primary) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconContainer}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={Colors.gradientViolet}
            style={styles.profileHeaderGradient}
          >
            <Ionicons name="person" size={48} color={Colors.white} />
          </LinearGradient>
          <Text style={styles.name}>{userProfile?.name || "User Profile"}</Text>
          <Text style={styles.email}>
            {userProfile?.email || "user@example.com"}
          </Text>
          <Text style={styles.role}>
            {userProfile?.role
              ? userProfile.role.charAt(0).toUpperCase() +
                userProfile.role.slice(1)
              : "User"}
          </Text>
        </View>

        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              "Total Events",
              stats.totalEvents,
              "calendar",
              Colors.primary
            )}
            {renderStatCard(
              "Completed",
              stats.completedEvents,
              "checkmark-circle",
              Colors.success
            )}
            {renderStatCard(
              "Upcoming",
              stats.upcomingEvents,
              "time",
              Colors.warning
            )}
            {renderStatCard(
              "Attendance",
              stats.totalAttendance,
              "people",
              Colors.info
            )}
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <LinearGradient
              colors={[Colors.white, Colors.background]}
              style={styles.infoGradient}
            >
              {renderInfoRow(
                "User ID",
                userProfile?.userId || "N/A",
                "finger-print"
              )}
              {renderInfoRow(
                "Role",
                userProfile?.role || "N/A",
                "shield-checkmark"
              )}
              {renderInfoRow("Email", userProfile?.email || "N/A", "mail")}
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Home")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="calendar" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>View Events</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[Colors.secondary, Colors.secondaryDark]}
                style={styles.actionButtonGradient}
              >
                <Ionicons name="notifications" size={24} color={Colors.white} />
                <Text style={styles.actionButtonText}>Notifications</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={Colors.gradientSunset}
              style={styles.logoutButtonGradient}
            >
              <Ionicons name="log-out-outline" size={24} color={Colors.white} />
              <Text style={[styles.logoutButtonText, textStyles.buttonMedium]}>
                Logout
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    ...textStyles.bodyMedium,
    color: Colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  profileHeaderGradient: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  name: {
    ...textStyles.h2,
    color: Colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    ...textStyles.bodyMedium,
    color: Colors.textSecondary,
    marginBottom: spacing.xs,
  },
  role: {
    ...textStyles.bodySmall,
    color: Colors.primary,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: Colors.textPrimary,
    marginBottom: spacing.md,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  statCard: {
    width: "48%",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  statGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statIconContainer: {
    marginRight: spacing.md,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    ...textStyles.h3,
    color: Colors.textPrimary,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.bodySmall,
    color: Colors.textTertiary,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  infoGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoIconContainer: {
    marginRight: spacing.md,
    width: 24,
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...textStyles.bodySmall,
    color: Colors.textTertiary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...textStyles.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: "500",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...textStyles.bodyMedium,
    color: Colors.white,
    fontWeight: "600",
  },
  logoutContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoutButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  logoutButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
});
