// src/components/ui/Button.js

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import PropTypes from "prop-types";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "../../utils/colors";
import { textStyles } from "../../utils/typography";
import { spacing, borderRadius, shadows } from "../../utils/spacing";

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  compact = false,
  style,
  textStyle,
}) {
  const getVariantConfig = () => {
    switch (variant) {
      case "primary":
        return {
          gradient: Colors.gradientViolet, // Now coral gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "secondary":
        return {
          gradient: Colors.gradientCyan, // Now light coral gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "success":
        return {
          gradient: Colors.gradientGreen, // Soft green gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "warning":
        return {
          gradient: Colors.gradientAmber, // Peach gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "danger":
        return {
          gradient: Colors.gradientSunset, // Coral to peach gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "info":
        return {
          gradient: Colors.gradientOcean, // Soft blue gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
      case "outline":
        return {
          gradient: [Colors.white, Colors.white],
          textColor: Colors.primary, // Now coral
          disabledGradient: [Colors.background, Colors.background],
          borderColor: Colors.primary, // Now coral
          disabledBorderColor: Colors.textDisabled,
        };
      case "ghost":
        return {
          gradient: [Colors.transparent, Colors.transparent],
          textColor: Colors.primary, // Now coral
          disabledGradient: [Colors.transparent, Colors.transparent],
        };
      default:
        return {
          gradient: Colors.gradientViolet, // Now coral gradient
          textColor: Colors.white,
          disabledGradient: [Colors.textDisabled, Colors.textDisabled],
        };
    }
  };

  const getSizeConfig = () => {
    const baseConfig = {
      small: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        fontSize: 14,
        iconSize: 24, // Increased from 20
        minHeight: 36,
      },
      medium: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        fontSize: 16,
        iconSize: 28, // Increased from 24
        minHeight: 44,
      },
      large: {
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        fontSize: 18,
        iconSize: 32, // Increased from 28
        minHeight: 52,
      },
    };

    const config = baseConfig[size] || baseConfig.medium;

    if (compact) {
      return {
        ...config,
        // For icon-only buttons, use minimal padding to maximize icon space
        paddingVertical: !title
          ? spacing.sm // Increased from xs for better icon spacing
          : Math.max(config.paddingVertical - 2, spacing.xs),
        paddingHorizontal: !title
          ? spacing.sm // Increased from xs for better icon spacing
          : Math.max(config.paddingHorizontal - 4, spacing.sm),
        fontSize: Math.max(config.fontSize - 1, 12),
        // For icon-only buttons, make icons larger and more visible
        iconSize: !title
          ? Math.max(config.iconSize + 12, 36) // Much larger icons to fill circles
          : Math.max(config.iconSize - 1, 14),
        minHeight: !title ? 32 : Math.max(config.minHeight - 4, 32),
      };
    }

    return config;
  };

  const variantConfig = getVariantConfig();
  const sizeConfig = getSizeConfig();
  const isDisabled = disabled || loading;

  const buttonContent = (
    <LinearGradient
      colors={
        isDisabled ? variantConfig.disabledGradient : variantConfig.gradient
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        styles.gradient,
        {
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          minHeight: sizeConfig.minHeight,
          borderWidth: variant === "outline" ? 2 : 0,
          borderColor: isDisabled
            ? variantConfig.disabledBorderColor || Colors.textDisabled
            : variantConfig.borderColor || Colors.transparent,
          // Make icon-only buttons more circular
          borderRadius: !title ? borderRadius.full : borderRadius.lg,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? Colors.primary : Colors.white}
        />
      ) : (
        <View
          style={[
            styles.contentContainer,
            !title && styles.centerContent,
            !title && styles.iconOnlyButton,
          ]}
        >
          {icon && iconPosition === "left" && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={isDisabled ? Colors.textDisabled : variantConfig.textColor}
              style={styles.leftIcon}
            />
          )}
          {title && (
            <Text
              style={[
                styles.text,
                {
                  fontSize: sizeConfig.fontSize,
                  color: isDisabled
                    ? Colors.textDisabled
                    : variantConfig.textColor,
                  fontWeight: variant === "outline" ? "600" : "600",
                },
                textStyle,
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {title}
            </Text>
          )}
          {icon && iconPosition === "right" && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={isDisabled ? Colors.textDisabled : variantConfig.textColor}
              style={styles.rightIcon}
            />
          )}
          {icon && iconPosition === "center" && (
            <Ionicons
              name={icon}
              size={sizeConfig.iconSize}
              color={isDisabled ? Colors.textDisabled : variantConfig.textColor}
              style={styles.centerIcon}
            />
          )}
        </View>
      )}
    </LinearGradient>
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title || `Button with ${icon} icon`}
      accessibilityState={{ disabled: isDisabled }}
    >
      {buttonContent}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.md,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  fullWidth: {
    width: "100%",
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  centerIcon: {
    marginHorizontal: 0, // Remove horizontal margin for center icons
    alignSelf: "center", // Ensure perfect centering
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%", // Ensure full width for proper centering
  },
  iconOnlyButton: {
    aspectRatio: 1, // Ensure perfect circle
    justifyContent: "center",
    alignItems: "center",
  },
});

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "warning",
    "danger",
    "info",
    "outline",
    "ghost",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.string,
  iconPosition: PropTypes.oneOf(["left", "right", "center"]),
  fullWidth: PropTypes.bool,
  compact: PropTypes.bool,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
