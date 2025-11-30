// src/components/Header.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function Header({
  title,
  subtitle,
  showBack = true,
  onBackPress,
  rightComponent,
  backgroundColor = Colors.primary,
  textColor = Colors.white,
  showGradient = true,
  elevation = 8,
}) {
  const navigation = useNavigation();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const HeaderContent = () => (
    <View style={styles.headerContent}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.1)"]}
            style={styles.backButtonGradient}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: textColor + "CC" }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightComponent && (
        <View style={styles.rightComponent}>{rightComponent}</View>
      )}
    </View>
  );

  if (showGradient) {
    return (
      <View style={styles.headerContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { elevation }]}
        >
          <HeaderContent />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={backgroundColor} />
      <View style={[styles.header, { backgroundColor, elevation }]}>
        <HeaderContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.white,
    zIndex: 1000,
  },
  header: {
    paddingTop: 44, // Status bar height
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    ...shadows.xl,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    ...shadows.md,
    overflow: "hidden",
  },
  backButtonGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: spacing.xs,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  rightComponent: {
    alignItems: "flex-end",
  },
});
