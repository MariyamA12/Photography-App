// src/utils/theme.js
// Theme configuration for the mobile app

const theme = {
  colors: {
    primary: "#E69D86", // Now coral
    secondary: "#F0B8A3", // Now light coral
    primaryCoral: "#E69D86", // Main coral
    primaryGrey: "#5C5C5C",
    white: "#FFFFFF",
    black: "#000000",
    background: "#FFFFFF",
    textPrimary: "#2D3748", // Dark gray that works well with coral
    textSecondary: "#4A5568", // Medium gray
    textTertiary: "#718096", // Lighter gray
    border: "#F7E8E0", // Light coral border
    borderLight: "#FBE4D8", // Very light coral border
    error: "#E69D86", // Now coral for consistency
    success: "#A8D5BA", // Soft green that complements coral
    warning: "#F4C4B3", // Now peach coral
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    "2xl": 48,
    "3xl": 64,
  },

  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    "2xl": 24,
    full: 9999,
  },

  typography: {
    fontFamily: {
      regular: "System",
      medium: "System",
      semiBold: "System",
      bold: "System",
    },
    h1: {
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 32,
    },
    h2: {
      fontSize: 20,
      fontWeight: "600",
      lineHeight: 28,
    },
    h3: {
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
    },
    h4: {
      fontSize: 16,
      fontWeight: "500",
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    },
    labelBold: {
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: "500",
      lineHeight: 16,
    },
  },

  shadows: {
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
  },

  components: {
    card: {
      default: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 24,
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
      elevated: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 24,
        shadowColor: "rgba(0, 0, 0, 0.1)",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
      },
    },
  },
};

export default theme;
