import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "../utils/colors";
import { spacing, borderRadius, shadows } from "../utils/spacing";

const { width, height } = Dimensions.get("window");

export default function SplashScreen({ onAnimationComplete }) {
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const fadeOutOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start animation sequence
    const animationSequence = async () => {
      // Logo scale and fade in
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Wait for logo animation to complete, then animate title
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, 800);

      // Wait for title animation, then fade out everything
      setTimeout(() => {
        Animated.timing(fadeOutOpacity, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }).start(() => {
          onAnimationComplete();
        });
      }, 2500);
    };

    animationSequence();
  }, []);

  return (
    <View style={styles.container}>
      {/* Background with coral theme for logo visibility */}
      <LinearGradient
        colors={[Colors.primary, Colors.primaryDark, Colors.secondaryDark]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeOutOpacity,
          },
        ]}
      >
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoBackground}>
            <Image
              source={require("../../assets/Logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View
          style={[
            styles.titleContainer,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>ROZ AND KIRSTY</Text>
          <Text style={styles.subtitle}>PHOTOGRAPHER PORTAL</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    marginBottom: spacing["4xl"], // Using 4xl spacing for better visual balance
  },
  logoBackground: {
    width: 160,
    height: 160,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    ...shadows.xl,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.white,
    textAlign: "center",
    marginBottom: spacing.sm,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    opacity: 0.95,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
});
