// src/utils/spacing.js

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 80, // Added 4xl spacing for more flexibility
};

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 12,
  },
};

export const layout = {
  screenPadding: spacing.md,
  cardPadding: spacing.md,
  buttonPadding: {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
  },
  inputPadding: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
};

export default {
  spacing,
  borderRadius,
  shadows,
  layout,
};
