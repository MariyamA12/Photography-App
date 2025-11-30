// src/components/ErrorBoundary.js

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Colors from "../utils/colors";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Log the error
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The app encountered an error. Please try restarting the app.
          </Text>

          {this.state.error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Error Details:</Text>
              <Text style={styles.errorText}>
                {this.state.error.toString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              this.setState({ hasError: false, error: null, errorInfo: null })
            }
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  errorContainer: {
    backgroundColor: Colors.errorLight,
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
    width: "100%",
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.error,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
    fontFamily: "monospace",
  },
  button: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ErrorBoundary;
