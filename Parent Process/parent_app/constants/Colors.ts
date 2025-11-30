/**
 * Unified color palette for the parent app with consistent peachy theme
 * Based on the login screen design (#E69D86) for visual consistency
 */

// Peachy color palette
const peachPrimary = '#E69D86';        // Main peachy color from login
const peachSecondary = '#F4B8A4';      // Lighter peachy shade
const peachDark = '#D88B6B';           // Darker peachy shade for contrast
const peachLight = '#F9E5DD';          // Very light peachy background
const peachAccent = '#C97856';         // Accent peachy color

const tintColorLight = peachPrimary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    backgroundSecondary: '#f9f9f9',
    backgroundLight: peachLight,
    tint: tintColorLight,
    primary: peachPrimary,
    secondary: peachSecondary,
    accent: peachAccent,
    dark: peachDark,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#E8E8E8',
    borderLight: '#F0F0F0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: peachPrimary,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    backgroundSecondary: '#1A1A1A',
    backgroundLight: '#2A2A2A',
    tint: tintColorDark,
    primary: peachPrimary,
    secondary: peachSecondary,
    accent: peachAccent,
    dark: peachDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#333',
    borderLight: '#444',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: peachPrimary,
  },
};

// Export individual colors for easy access
export const PeachyColors = {
  primary: peachPrimary,
  secondary: peachSecondary,
  dark: peachDark,
  light: peachLight,
  accent: peachAccent,
};
