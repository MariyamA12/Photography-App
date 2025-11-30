// src/utils/gridSystem.js
// Grid system according to design specification: 4 columns, 24px gutter and margin

import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// Design specification constants
export const GRID_SPECS = {
  COLUMNS: 4,
  GUTTER: 24,
  MARGIN: 24,
  SCREEN_WIDTH: {
    MIN: 360,
    MAX: 414,
  },
};

// Calculate available content width
export const getContentWidth = () => {
  return screenWidth - 2 * GRID_SPECS.MARGIN;
};

// Calculate column width
export const getColumnWidth = () => {
  const contentWidth = getContentWidth();
  const totalGutterWidth = (GRID_SPECS.COLUMNS - 1) * GRID_SPECS.GUTTER;
  return (contentWidth - totalGutterWidth) / GRID_SPECS.COLUMNS;
};

// Grid positioning utilities
export const gridPosition = {
  // Full width (spans all 4 columns)
  full: {
    width: "100%",
    marginHorizontal: 0,
  },

  // Half width (spans 2 columns)
  half: {
    width: `calc(50% - ${GRID_SPECS.GUTTER / 2}px)`,
    marginHorizontal: GRID_SPECS.GUTTER / 2,
  },

  // Third width (spans 1.33 columns)
  third: {
    width: `calc(33.333% - ${(GRID_SPECS.GUTTER * 2) / 3}px)`,
    marginHorizontal: GRID_SPECS.GUTTER / 3,
  },

  // Quarter width (spans 1 column)
  quarter: {
    width: `calc(25% - ${(GRID_SPECS.GUTTER * 3) / 4}px)`,
    marginHorizontal: GRID_SPECS.GUTTER / 4,
  },
};

// Spacing utilities based on design spec
export const gridSpacing = {
  // Container spacing
  container: {
    paddingHorizontal: GRID_SPECS.MARGIN,
    paddingVertical: GRID_SPECS.MARGIN,
  },

  // Section spacing
  section: {
    marginBottom: GRID_SPECS.MARGIN,
  },

  // Item spacing
  item: {
    marginBottom: GRID_SPECS.GUTTER,
  },

  // Row spacing
  row: {
    marginBottom: GRID_SPECS.GUTTER,
  },

  // Column spacing
  column: {
    marginRight: GRID_SPECS.GUTTER,
  },
};

// Responsive breakpoints for mobile design
export const breakpoints = {
  small: 360, // Design spec minimum
  medium: 375, // Common mobile width
  large: 414, // Design spec maximum
};

// Responsive utilities
export const responsive = {
  // Apply different styles based on screen width
  small: (styles) => (screenWidth <= breakpoints.small ? styles : {}),
  medium: (styles) =>
    screenWidth > breakpoints.small && screenWidth <= breakpoints.medium
      ? styles
      : {},
  large: (styles) => (screenWidth > breakpoints.medium ? styles : {}),

  // Responsive padding
  padding: {
    small: GRID_SPECS.MARGIN * 0.75, // 18px
    medium: GRID_SPECS.MARGIN, // 24px
    large: GRID_SPECS.MARGIN * 1.25, // 30px
  },

  // Responsive font sizes
  fontSize: {
    small: 14,
    medium: 16, // Design spec minimum
    large: 18,
  },
};

// Grid container component styles
export const gridContainer = {
  ...gridSpacing.container,
  flex: 1,
  backgroundColor: "#FFFFFF", // Design spec primary color
};

// Grid row component styles
export const gridRow = {
  flexDirection: "row",
  flexWrap: "wrap",
  marginHorizontal: -GRID_SPECS.GUTTER / 2,
  ...gridSpacing.row,
};

// Grid column component styles
export const gridColumn = (span = 1) => ({
  width: `${(span / GRID_SPECS.COLUMNS) * 100}%`,
  paddingHorizontal: GRID_SPECS.GUTTER / 2,
  ...gridSpacing.column,
});

export default {
  GRID_SPECS,
  gridPosition,
  gridSpacing,
  breakpoints,
  responsive,
  gridContainer,
  gridRow,
  gridColumn,
  getContentWidth,
  getColumnWidth,
};
