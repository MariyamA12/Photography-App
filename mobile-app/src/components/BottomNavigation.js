// src/components/BottomNavigation.js

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function BottomNavigation({ activeTab, onTabPress }) {
  const tabs = [
    {
      key: "events",
      icon: "calendar",
      activeIcon: "calendar",
    },
    {
      key: "notifications",
      icon: "notifications-outline",
      activeIcon: "notifications",
    },
    {
      key: "profile",
      icon: "person-outline",
      activeIcon: "person",
    },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const iconName = isActive ? tab.activeIcon : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.activeIconContainer,
                ]}
              >
                <LinearGradient
                  colors={
                    isActive
                      ? Colors.gradientViolet // Now coral gradient
                      : [Colors.background, Colors.background]
                  }
                  style={styles.iconGradient}
                >
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isActive ? Colors.white : Colors.textSecondary}
                  />
                </LinearGradient>
              </View>
              {isActive && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.xl,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    alignItems: "center",
  },
  tabContent: {
    alignItems: "center",
    position: "relative",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.md,
    marginBottom: spacing.xs,
  },
  activeIconContainer: {
    ...shadows.lg,
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: borderRadius.full,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -spacing.xs,
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.primary,
    ...shadows.sm,
  },
});
