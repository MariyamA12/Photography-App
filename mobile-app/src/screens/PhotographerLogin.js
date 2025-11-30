// src/screens/PhotographerLogin.js

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

const { width, height } = Dimensions.get("window");

export default function PhotographerLogin() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again"
      );
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSSOLogin = async () => {
    setIsLoading(true);
    try {
      // Use the provided login credentials for Google SSO demo
      await signIn("john@gmail.com", "121212");
    } catch (err) {
      console.error("Google SSO login failed:", err);

      // Provide more specific error messages based on the error
      let errorMessage =
        "Google SSO login failed. Please try again or use regular login.";

      if (err.response?.status === 401) {
        errorMessage = "Invalid credentials. Please check your login details.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.message?.includes("Network Error")) {
        errorMessage = "Network error. Please check your connection.";
      }

      Alert.alert("Google SSO Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#E69D86" />

      {/* Background Gradient - Coral to White */}
      <LinearGradient
        colors={["#E69D86", "#F0B8A3", "#F7D1C0", "#FFFFFF"]}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Logo/Brand Section - More Compact */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={["#E69D86", "#F0B8A3"]}
              style={styles.logoGradient}
            >
              <Ionicons name="camera" size={32} color={Colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>ROZ AND KIRSTY</Text>
          <Text style={styles.subtitle}>PHOTOGRAPHER PORTAL</Text>
          <Text style={styles.description}>
            Access your photography events and manage attendance
          </Text>
        </View>

        {/* Login Form - More Compact and Elegant */}
        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Welcome Back</Text>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <LinearGradient
                    colors={["#E69D86", "#F0B8A3"]}
                    style={styles.inputIconGradient}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={16}
                      color={Colors.white}
                    />
                  </LinearGradient>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#C4C4C4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  accessibilityLabel="Email input field"
                  accessibilityHint="Enter your email address"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}>
                  <LinearGradient
                    colors={["#F0B8A3", "#F7D1C0"]}
                    style={styles.inputIconGradient}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={Colors.white}
                    />
                  </LinearGradient>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#C4C4C4"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  accessibilityLabel="Password input field"
                  accessibilityHint="Enter your password"
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color="#E69D86"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button - More Elegant */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Login button"
              accessibilityHint="Tap to sign in to your account"
            >
              <LinearGradient
                colors={
                  isLoading ? ["#F0B8A3", "#F7D1C0"] : ["#E69D86", "#F0B8A3"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButtonGradient}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons
                      name="hourglass-outline"
                      size={18}
                      color={Colors.white}
                    />
                    <Text style={styles.loadingText}>Signing In...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={Colors.white}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google SSO Login Button - Styled to match Google's design language */}
            <TouchableOpacity
              style={styles.ssoButton}
              onPress={handleGoogleSSOLogin}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Google SSO login button"
              accessibilityHint="Tap to sign in with Google SSO"
            >
              <View style={styles.ssoButtonContent}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons
                      name="hourglass-outline"
                      size={18}
                      color="#5F6368"
                    />
                    <Text style={styles.ssoLoadingText}>Signing In...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.googleIconContainer}>
                      <Ionicons name="logo-google" size={20} color="#4285F4" />
                    </View>
                    <Text style={styles.ssoButtonText}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer - More Compact */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Secure access to your photography events
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.05, // Reduced from 0.08
    marginBottom: height * 0.03, // Reduced from 0.06
  },
  logoContainer: {
    marginBottom: spacing.lg, // Reduced from xl
  },
  logoGradient: {
    width: 64, // Reduced from 80
    height: 64, // Reduced from 80
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
  title: {
    fontSize: 24, // Reduced from 28
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    marginBottom: spacing.xs,
    letterSpacing: 1.2,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 14, // Reduced from 16
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginBottom: spacing.sm, // Reduced from md
    opacity: 0.9,
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.15)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    fontSize: 13, // Reduced from 15
    fontWeight: "400",
    color: Colors.white,
    textAlign: "center",
    opacity: 0.8,
    paddingHorizontal: spacing.md, // Reduced from lg
    lineHeight: 18, // Reduced from 22
  },
  formContainer: {
    marginBottom: height * 0.03, // Reduced from 0.05
  },
  formCard: {
    backgroundColor: Colors.white,
    padding: spacing.lg, // Reduced from xl
    borderRadius: borderRadius.xl,
    ...shadows.xl,
    borderWidth: 1,
    borderColor: "#F7E8E0", // Light coral border
  },
  formTitle: {
    fontSize: 20, // Reduced from 22
    fontWeight: "700",
    color: "#E69D86", // Coral color
    textAlign: "center",
    marginBottom: spacing.lg, // Reduced from xl
    letterSpacing: 0.5,
  },
  inputWrapper: {
    marginBottom: spacing.md, // Reduced from lg
  },
  inputLabel: {
    fontSize: 13, // Reduced from 14
    fontWeight: "600",
    color: "#E69D86", // Coral color
    marginBottom: spacing.xs, // Reduced from sm
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF9F6", // Very light coral background
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: "#F7E8E0", // Light coral border
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, // Reduced from sm
    ...shadows.sm,
  },
  inputIconContainer: {
    marginRight: spacing.md,
  },
  inputIconGradient: {
    width: 32, // Reduced from 36
    height: 32, // Reduced from 36
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40, // Reduced from 44
    fontSize: 15, // Reduced from 16
    color: "#333333",
    fontWeight: "500",
    paddingVertical: spacing.xs, // Reduced from sm
  },
  passwordToggle: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  loginButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginTop: spacing.sm, // Reduced from md
    marginBottom: spacing.md, // Reduced from lg
    ...shadows.md,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md, // Reduced from lg
    paddingHorizontal: spacing.lg, // Reduced from xl
    gap: spacing.sm, // Reduced from md
  },
  loginButtonText: {
    fontSize: 16, // Reduced from 18
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.8,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999999",
    marginHorizontal: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ssoButton: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.md,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
    ...shadows.sm,
  },
  ssoButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  ssoButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C4043",
    letterSpacing: 0.2,
  },
  googleIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  ssoLoadingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5F6368",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 15, // Reduced from 16
    fontWeight: "600",
    color: Colors.white,
  },
  forgotPassword: {
    alignItems: "center",
    paddingVertical: spacing.xs, // Reduced from sm
  },
  forgotPasswordText: {
    fontSize: 14, // Reduced from 15
    fontWeight: "600",
    color: "#E69D86", // Coral color
    textDecorationLine: "underline",
  },
  footer: {
    alignItems: "center",
    marginBottom: height * 0.02, // Reduced from 0.04
  },
  footerText: {
    fontSize: 12, // Reduced from 13
    fontWeight: "400",
    color: "#E69D86", // Coral color
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 16, // Reduced from 18
  },
});
