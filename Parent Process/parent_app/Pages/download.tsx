import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { PeachyColors } from "../constants/Colors";

export default function Download() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={PeachyColors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Download Photos</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Ionicons name="cloud-download" size={48} color={PeachyColors.primary} />
          <Text style={styles.infoTitle}>Download Your Photos</Text>
          <Text style={styles.infoText}>
            Access your purchased photos and download them to your device.
          </Text>
        </View>

        <View style={styles.optionCard}>
          <Text style={styles.optionTitle}>From Purchase History</Text>
          <Text style={styles.optionText}>
            View your past orders and download photos from each purchase.
          </Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Text style={styles.optionButtonText}>Go to Profile</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.optionCard}>
          <Text style={styles.optionTitle">From Gallery</Text>
          <Text style={styles.optionText">
            Browse your photos and download those you've already purchased.
          </Text>
          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => router.push("/(tabs)/gallery")}
          >
            <Text style={styles.optionButtonText}>Go to Gallery</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.helpCard}>
          <Text style={styles.helpTitle}>How to Download</Text>
          <View style={styles.helpItem}>
            <Ionicons name="checkmark-circle" size={20} color={PeachyColors.primary} />
            <Text style={styles.helpText}>Photos must be purchased before downloading</Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="checkmark-circle" size={20} color={PeachyColors.primary} />
            <Text style={styles.helpText}>Use the download button next to each photo</Text>
          </View>
          <View style={styles.helpItem}>
            <Ionicons name="checkmark-circle" size={20} color={PeachyColors.primary} />
            <Text style={styles.helpText}>Photos are saved to your device's gallery</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#11181C",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#11181C",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  optionCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: PeachyColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  optionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  helpCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#11181C",
    marginBottom: 16,
    textAlign: "center",
  },
  helpItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});
