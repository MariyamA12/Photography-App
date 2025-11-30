// src/components/EventCard.js

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import PropTypes from "prop-types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";
import { textStyles } from "../utils/typography";

export default function EventCard({ event, onPress, onArrowPress }) {
  // Add null checks for event and event_date
  if (!event || !event.event_date) {
    console.warn("EventCard: Missing event or event_date", { event });
    return null; // Don't render anything if event data is missing
  }

  // Additional safety checks for required properties
  if (!event.id || !event.name) {
    console.warn("EventCard: Event missing required properties", { event });
    return null;
  }

  // Safe date parsing with error handling
  let formattedDate;
  try {
    const eventDate = new Date(event.event_date);
    if (isNaN(eventDate.getTime())) {
      console.warn("EventCard: Invalid event_date", {
        event_date: event.event_date,
      });
      return null;
    }
    formattedDate = eventDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.error("EventCard: Error parsing date", error, {
      event_date: event.event_date,
    });
    return null;
  }

  const isToday = () => {
    try {
      const today = new Date();
      const eventDate = new Date(event.event_date);
      return today.toDateString() === eventDate.toDateString();
    } catch (error) {
      console.error("EventCard: Error in isToday", error);
      return false;
    }
  };

  const isUpcoming = () => {
    try {
      const today = new Date();
      const eventDate = new Date(event.event_date);
      return eventDate > today;
    } catch (error) {
      console.error("EventCard: Error in isUpcoming", error);
      return false;
    }
  };

  const isFinished = !!event.is_finished;


  const getStatusConfig = () => {
    if (isFinished) {
      return {
        label: "COMPLETED",               
        color: Colors.primary,              
        bgColor: Colors.borderLight,
        icon: "checkmark-done",
        gradient: Colors.gradientOcean, 
      };
    } 
    if (isToday()) {
      return {
        label: "TODAY",
        color: Colors.today, // Now coral
        bgColor: Colors.errorLight, // Now coral light
        icon: "today",
        gradient: Colors.gradientSunset, // Coral to peach
      };
    }
    if (isUpcoming()) {
      return {
        label: "UPCOMING",
        color: Colors.upcoming, // Now soft green
        bgColor: Colors.successLight, // Now soft green light
        icon: "time",
        gradient: Colors.gradientGreen, // Soft green
      };
    }
    return {
      label: "PAST",
      color: Colors.past, // Now muted coral
      bgColor: Colors.borderLight, // Now very light coral
      icon: "checkmark-circle",
      gradient: Colors.gradientViolet, // Now coral gradient
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        activeOpacity={0.95}
        accessibilityRole="button"
        accessibilityLabel={`Open QR scanner for ${event.name}`}
      >
        {/* Status Badge - Green UPCOMING */}
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Ionicons
              name={statusConfig.icon}
              size={16}
              color={Colors.white}
              style={styles.statusIcon}
            />
            <Text style={[styles.statusText, textStyles.caption]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          <Text style={[styles.title, textStyles.heading3]} numberOfLines={2}>
            {event.name}
          </Text>

          {/* Date Display with Calendar Icon */}
          <View style={styles.dateContainer}>
            <View style={styles.dateIconContainer}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color={Colors.secondary}
              />
            </View>
            <Text style={[styles.dateText, textStyles.bodyMedium]}>
              {formattedDate}
            </Text>
          </View>

          {/* Action Buttons Container - Side by Side */}
          <View style={styles.actionContainer}>
            <View style={styles.buttonRow}>
              {/* Show Details Button */}
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={onArrowPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientOcean} // Soft blue gradient
                  style={styles.detailsButtonGradient}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={[styles.buttonText, textStyles.buttonMedium]}>
                    Show Details
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Scan QR Button */}
              <TouchableOpacity
                style={styles.scanButton}
                onPress={onPress}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Colors.gradientViolet} // Now coral gradient
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.scanButtonGradient}
                >
                  <Ionicons
                    name="qr-code-outline"
                    size={20}
                    color={Colors.white}
                  />
                  <Text style={[styles.buttonText, textStyles.buttonMedium]}>
                    Scan QR
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: "relative",
    overflow: "hidden",
  },
  statusContainer: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.success, // Now soft green
    ...shadows.sm,
  },
  statusIcon: {
    marginRight: spacing.xs,
  },
  statusText: {
    color: Colors.white,
    textTransform: "uppercase",
    fontWeight: "600",
    fontSize: 12,
  },
  contentContainer: {
    marginTop: spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: spacing.md,
    lineHeight: 24,
    fontWeight: "600",
    fontSize: 18,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  dateIconContainer: {
    marginRight: spacing.sm,
  },
  dateText: {
    color: Colors.textSecondary,
    fontWeight: "500",
    fontSize: 16,
  },
  actionContainer: {
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  detailsButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
    height: 56,
  },
  detailsButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: "100%",
    width: "100%",
  },
  scanButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
    height: 56,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    height: "100%",
    width: "100%",
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "600",
    textAlign: "center",
  },
});

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    event_date: PropTypes.string.isRequired,
    school_name: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onArrowPress: PropTypes.func,
};
