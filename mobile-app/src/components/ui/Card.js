// src/components/ui/Card.js
// New Card component using the design system

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import PropTypes from "prop-types";
import theme from "../../utils/theme";

export default function Card({
  children,
  variant = "default",
  padding = "medium",
  margin = "medium",
  style,
  title,
  subtitle,
  footer,
}) {
  const getPadding = () => {
    switch (padding) {
      case "small":
        return theme.spacing.md; // 16px
      case "medium":
        return theme.spacing.lg; // 24px - Design spec
      case "large":
        return theme.spacing.xl; // 32px
      default:
        return theme.spacing.lg; // 24px - Design spec
    }
  };

  const getMargin = () => {
    switch (margin) {
      case "small":
        return theme.spacing.md; // 16px
      case "medium":
        return theme.spacing.lg; // 24px - Design spec
      case "large":
        return theme.spacing.xl; // 32px
      default:
        return theme.spacing.lg; // 24px - Design spec
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return theme.components.card.elevated;
      case "outlined":
        return {
          ...theme.components.card.default,
          borderWidth: 2,
          borderColor: theme.colors.primaryCoral,
        };
      case "primary":
        return {
          ...theme.components.card.default,
          backgroundColor: theme.colors.primaryCoral,
        };
      case "secondary":
        return {
          ...theme.components.card.default,
          backgroundColor: theme.colors.primaryGrey,
        };
      default:
        return theme.components.card.default;
    }
  };

  const cardStyles = [
    styles.card,
    getVariantStyles(),
    {
      padding: getPadding(),
      margin: getMargin(),
    },
    style,
  ];

  return (
    <View style={cardStyles}>
      {title && (
        <Text
          style={[
            styles.title,
            {
              color:
                variant === "primary" || variant === "secondary"
                  ? theme.colors.white
                  : theme.colors.textPrimary,
            },
          ]}
        >
          {title}
        </Text>
      )}
      {subtitle && (
        <Text
          style={[
            styles.subtitle,
            {
              color:
                variant === "primary" || variant === "secondary"
                  ? theme.colors.white
                  : theme.colors.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>
      )}
      <View style={styles.content}>{children}</View>
      {footer && (
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color:
                  variant === "primary" || variant === "secondary"
                    ? theme.colors.white
                    : theme.colors.textTertiary,
              },
            ]}
          >
            {footer}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadows.md,
  },
  title: {
    ...theme.typography.h3, // 18px, weight 600
    fontFamily: theme.typography.fontFamily.semiBold, // Poppins-SemiBold
    marginBottom: theme.spacing.sm,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodyMedium, // 16px, weight 400
    fontFamily: theme.typography.fontFamily.regular, // Poppins-Regular
    marginBottom: theme.spacing.md,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  footer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  footerText: {
    ...theme.typography.caption, // 14px, weight 500
    fontFamily: theme.typography.fontFamily.medium, // Poppins-Medium
    color: theme.colors.textTertiary,
  },
});

Card.propTypes = {
  children: PropTypes.node,
  variant: PropTypes.oneOf([
    "default",
    "elevated",
    "outlined",
    "primary",
    "secondary",
  ]),
  padding: PropTypes.oneOf(["small", "medium", "large"]),
  margin: PropTypes.oneOf(["small", "medium", "large"]),
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  footer: PropTypes.string,
};
