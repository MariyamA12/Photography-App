// src/components/DebugInfo.js

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

export default function DebugInfo() {
  const [isExpanded, setIsExpanded] = useState(false);

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert("Success", "Storage cleared successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to clear storage");
    }
  };

  const getStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      return items.map(([key, value]) => ({
        key,
        size: value ? value.length : 0,
        type: typeof value,
      }));
    } catch (error) {
      return [];
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Debug Information</Text>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={Colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <Text style={styles.text}>Version: 1.0.0</Text>
        <Text style={styles.text}>Platform: React Native</Text>
        <Text style={styles.text}>Environment: Development</Text>
        <Text style={styles.text}>Build: Debug</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <Text style={styles.text}>OS: React Native</Text>
        <Text style={styles.text}>Version: Latest</Text>
        <Text style={styles.text}>Architecture: Mobile</Text>
        <Text style={styles.text}>Screen: Responsive</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage Information</Text>
        <TouchableOpacity style={styles.clearButton} onPress={clearStorage}>
          <Text style={styles.clearButtonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Error Logs</Text>
        <Text style={styles.text}>No errors logged</Text>
        <Text style={styles.errorText}>System running normally</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  expandButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: Colors.primaryMuted,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: spacing.sm,
  },
  text: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginBottom: spacing.sm,
    lineHeight: 22,
  },
  clearButton: {
    backgroundColor: Colors.error,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});
