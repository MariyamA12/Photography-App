// src/components/NotificationItem.js

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function NotificationItem({
  notification,
  onPress,
  onMarkAsRead,
}) {
  const getNotificationIcon = (type) => {
    switch (type) {
      case "event":
        return "calendar-outline";
      case "attendance":
        return "checkmark-circle-outline";
      case "photo":
        return "camera-outline";
      case "reminder":
        return "time-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "event":
        return Colors.gradientViolet; // Now coral gradient
      case "attendance":
        return Colors.gradientGreen; // Soft green gradient
      case "photo":
        return Colors.gradientAmber; // Now peach gradient
      case "reminder":
        return Colors.gradientCyan; // Now light coral gradient
      default:
        return Colors.gradientOcean; // Soft blue gradient
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return "Today";
      } else if (diffDays === 2) {
        return "Yesterday";
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return "Date error";
    }
  };

  const iconName = getNotificationIcon(notification.type);
  const gradientColors = getNotificationColor(notification.type);

  const handlePress = () => {
    console.log("NotificationItem pressed:", notification.id);
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Notification: ${
        notification.subject || notification.title || "Notification"
      }`}
    >
      <View style={styles.card}>
        {/* Notification Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={iconName} size={24} color={Colors.white} />
          </LinearGradient>
        </View>

        {/* Notification Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {notification.subject || notification.title || "Notification"}
            </Text>
            {!notification.read && (
              <View style={styles.unreadIndicator}>
                <LinearGradient
                  colors={Colors.gradientSunset}
                  style={styles.unreadGradient}
                />
              </View>
            )}
          </View>

          <Text style={styles.message} numberOfLines={3}>
            {notification.message}
          </Text>

          <View style={styles.footerContainer}>
            <Text style={styles.timestamp}>
              {formatDate(
                notification.sentAt ||
                  notification.created_at ||
                  notification.timestamp
              )}
            </Text>

            {!notification.read && (
              <TouchableOpacity
                style={styles.markAsReadButton}
                onPress={onMarkAsRead}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Mark as read"
              >
                <Text style={styles.markAsReadText}>Mark as read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    ...shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  iconContainer: {
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  unreadGradient: {
    width: "100%",
    height: "100%",
    borderRadius: borderRadius.full,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "500",
  },
  markAsReadButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.primaryMuted,
  },
  markAsReadText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
});

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
};
