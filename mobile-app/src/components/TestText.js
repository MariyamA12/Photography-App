// src/components/TestText.js

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Colors from "../utils/colors";

export default function TestText() {
  return (
    <View style={styles.container}>
      <Text style={styles.heading1}>Heading 1 - Test Text</Text>
      <Text style={styles.heading2}>Heading 2 - Test Text</Text>
      <Text style={styles.bodyText}>Body Text - Test Text</Text>
      <Text style={styles.buttonText}>Button Text - Test Text</Text>
      <Text style={styles.captionText}>Caption Text - Test Text</Text>

      {/* Test with basic Text component */}
      <Text style={styles.basicText}>Basic Text Component</Text>

      {/* Test with inline styles */}
      <Text style={styles.inlineText}>Inline Styled Text</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  heading1: {
    fontSize: 30,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 10,
  },
  captionText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  basicText: {
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  inlineText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
  },
});
