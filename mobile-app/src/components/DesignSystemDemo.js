// src/components/DesignSystemDemo.js
// Demo component showcasing the new design system

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import Button from "./ui/Button";
import Card from "./ui/Card";
import theme from "../utils/theme";
import {
  gridContainer,
  gridRow,
  gridColumn,
  gridSpacing,
} from "../utils/gridSystem";

export default function DesignSystemDemo() {
  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Design System Demo</Text>
        <Text style={styles.headerSubtitle}>
          Implementing the design specification with Poppins font, 4-column
          grid, and 24px spacing
        </Text>
      </View>

      {/* Color Palette Section */}
      <Card
        title="Color Palette"
        subtitle="Design specification colors"
        style={styles.section}
      >
        <View style={styles.colorGrid}>
          <View style={styles.colorItem}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text style={styles.colorLabel}>Primary</Text>
            <Text style={styles.colorHex}>#FFFFFF</Text>
          </View>
          <View style={styles.colorItem}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: theme.colors.secondary },
              ]}
            />
            <Text style={styles.colorLabel}>Secondary</Text>
            <Text style={styles.colorHex}>#000000</Text>
          </View>
          <View style={styles.colorItem}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: theme.colors.primaryCoral },
              ]}
            />
            <Text style={styles.colorLabel}>Primary Coral</Text>
            <Text style={styles.colorHex}>#E69D86</Text>
          </View>
          <View style={styles.colorItem}>
            <View
              style={[
                styles.colorSwatch,
                { backgroundColor: theme.colors.primaryGrey },
              ]}
            />
            <Text style={styles.colorLabel}>Primary Grey</Text>
            <Text style={styles.colorHex}>#5C5C5C</Text>
          </View>
        </View>
      </Card>

      {/* Typography Section */}
      <Card
        title="Typography"
        subtitle="Poppins font family, 16px-24px, weights 400-700"
        style={styles.section}
      >
        <View style={styles.typographyGrid}>
          <Text style={styles.typographyH1}>Heading 1 - 24px, Weight 700</Text>
          <Text style={styles.typographyH2}>Heading 2 - 20px, Weight 600</Text>
          <Text style={styles.typographyH3}>Heading 3 - 18px, Weight 600</Text>
          <Text style={styles.typographyH4}>Heading 4 - 16px, Weight 500</Text>
          <Text style={styles.typographyBody}>
            Body Text - 16px, Weight 400
          </Text>
          <Text style={styles.typographyCaption}>
            Caption - 14px, Weight 500
          </Text>
        </View>
      </Card>

      {/* Spacing Section */}
      <Card
        title="Spacing System"
        subtitle="24px gutter and margin as per design spec"
        style={styles.section}
      >
        <View style={styles.spacingGrid}>
          <View style={[styles.spacingItem, { margin: theme.spacing.xs }]}>
            <Text style={styles.spacingLabel}>XS: {theme.spacing.xs}px</Text>
          </View>
          <View style={[styles.spacingItem, { margin: theme.spacing.sm }]}>
            <Text style={styles.spacingLabel}>SM: {theme.spacing.sm}px</Text>
          </View>
          <View style={[styles.spacingItem, { margin: theme.spacing.md }]}>
            <Text style={styles.spacingLabel}>MD: {theme.spacing.md}px</Text>
          </View>
          <View style={[styles.spacingItem, { margin: theme.spacing.lg }]}>
            <Text style={styles.spacingLabel}>
              LG: {theme.spacing.lg}px (Design Spec)
            </Text>
          </View>
        </View>
      </Card>

      {/* Grid System Section */}
      <Card
        title="Grid System"
        subtitle="4 columns with 24px gutter and margin"
        style={styles.section}
      >
        <View style={styles.gridDemo}>
          <View style={[styles.gridRow, gridRow]}>
            <View style={[styles.gridColumn, gridColumn(1)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryCoral },
                ]}
              >
                <Text style={styles.gridCellText}>1/4</Text>
              </View>
            </View>
            <View style={[styles.gridColumn, gridColumn(1)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryGrey },
                ]}
              >
                <Text style={styles.gridCellText}>1/4</Text>
              </View>
            </View>
            <View style={[styles.gridColumn, gridColumn(1)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryCoral },
                ]}
              >
                <Text style={styles.gridCellText}>1/4</Text>
              </View>
            </View>
            <View style={[styles.gridColumn, gridColumn(1)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryGrey },
                ]}
              >
                <Text style={styles.gridCellText}>1/4</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gridRow, gridRow]}>
            <View style={[styles.gridColumn, gridColumn(2)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryCoral },
                ]}
              >
                <Text style={styles.gridCellText}>2/4</Text>
              </View>
            </View>
            <View style={[styles.gridColumn, gridColumn(2)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryGrey },
                ]}
              >
                <Text style={styles.gridCellText}>2/4</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gridRow, gridRow]}>
            <View style={[styles.gridColumn, gridColumn(4)]}>
              <View
                style={[
                  styles.gridCell,
                  { backgroundColor: theme.colors.primaryCoral },
                ]}
              >
                <Text style={styles.gridCellText}>4/4 Full Width</Text>
              </View>
            </View>
          </View>
        </View>
      </Card>

      {/* Button Variants Section */}
      <Card
        title="Button Variants"
        subtitle="Using the new design system colors"
        style={styles.section}
      >
        <View style={styles.buttonGrid}>
          <Button title="Primary" variant="primary" style={styles.button} />
          <Button title="Secondary" variant="secondary" style={styles.button} />
          <Button title="Outline" variant="outline" style={styles.button} />
          <Button title="Ghost" variant="ghost" style={styles.button} />
        </View>
      </Card>

      {/* Card Variants Section */}
      <Card
        title="Card Variants"
        subtitle="Different card styles using the design system"
        style={styles.section}
      >
        <View style={styles.cardGrid}>
          <Card
            variant="outlined"
            title="Outlined"
            subtitle="With border"
            style={styles.demoCard}
          />
          <Card
            variant="elevated"
            title="Elevated"
            subtitle="With shadow"
            style={styles.demoCard}
          />
          <Card
            variant="primary"
            title="Primary"
            subtitle="Coral background"
            style={styles.demoCard}
          />
          <Card
            variant="secondary"
            title="Secondary"
            subtitle="Grey background"
            style={styles.demoCard}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...gridContainer,
    backgroundColor: theme.colors.background,
  },

  header: {
    padding: theme.spacing.lg, // 24px - Design spec
    backgroundColor: theme.colors.primaryCoral,
    marginBottom: theme.spacing.lg,
  },

  headerTitle: {
    ...theme.typography.h1, // 24px, weight 700
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },

  headerSubtitle: {
    ...theme.typography.bodyMedium, // 16px, weight 400
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.white,
    opacity: 0.9,
  },

  section: {
    marginBottom: theme.spacing.lg, // 24px - Design spec
  },

  // Color Palette Styles
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  colorItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },

  colorSwatch: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  colorLabel: {
    ...theme.typography.labelBold,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },

  colorHex: {
    ...theme.typography.caption,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textSecondary,
  },

  // Typography Styles
  typographyGrid: {
    gap: theme.spacing.md,
  },

  typographyH1: {
    ...theme.typography.h1,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.textPrimary,
  },

  typographyH2: {
    ...theme.typography.h2,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },

  typographyH3: {
    ...theme.typography.h3,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.textPrimary,
  },

  typographyH4: {
    ...theme.typography.h4,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textPrimary,
  },

  typographyBody: {
    ...theme.typography.bodyMedium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textSecondary,
  },

  typographyCaption: {
    ...theme.typography.caption,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.textTertiary,
  },

  // Spacing Styles
  spacingGrid: {
    gap: theme.spacing.md,
  },

  spacingItem: {
    backgroundColor: theme.colors.primaryCoral,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },

  spacingLabel: {
    ...theme.typography.labelBold,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },

  // Grid System Styles
  gridDemo: {
    gap: theme.spacing.md,
  },

  gridRow: {
    marginBottom: theme.spacing.md,
  },

  gridColumn: {
    marginBottom: theme.spacing.md,
  },

  gridCell: {
    height: 60,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },

  gridCellText: {
    ...theme.typography.labelBold,
    fontFamily: theme.typography.fontFamily.semiBold,
    color: theme.colors.white,
  },

  // Button Styles
  buttonGrid: {
    gap: theme.spacing.md,
  },

  button: {
    marginBottom: theme.spacing.sm,
  },

  // Card Styles
  cardGrid: {
    gap: theme.spacing.md,
  },

  demoCard: {
    marginBottom: theme.spacing.md,
  },
});
