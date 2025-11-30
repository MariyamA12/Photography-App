// src/config/environment.js

// IMPORTANT: Change this to your actual machine's IP address
// You can find it by running 'ipconfig' on Windows or 'ifconfig' on Mac/Linux
// Look for your local network adapter (usually starts with 192.168.x.x or 10.0.x.x)
// For development, you can also use 'localhost' if running on the same machine
const YOUR_LOCAL_IP = "localhost"; // CHANGE THIS TO YOUR ACTUAL IP or use 'localhost'

// Default configuration for development
const DEFAULT_CONFIG = {
  API_BASE_URL: `http://${YOUR_LOCAL_IP}:3000/api`,
  PHOTOGRAPHER_API_BASE_URL: `http://${YOUR_LOCAL_IP}:3000/api/photographer`,
  TIMEOUT: 15000, // Increased timeout for mobile networks
};

// Environment-specific overrides
const getConfig = () => {
  // Check if we're in development mode
  if (__DEV__) {
    return {
      ...DEFAULT_CONFIG,
      // You can override these values for development if needed
    };
  }

  // Production configuration
  return {
    ...DEFAULT_CONFIG,
    API_BASE_URL:
      process.env.EXPO_PUBLIC_API_URL || DEFAULT_CONFIG.API_BASE_URL,
    PHOTOGRAPHER_API_BASE_URL:
      process.env.EXPO_PUBLIC_PHOTOGRAPHER_API_URL ||
      DEFAULT_CONFIG.PHOTOGRAPHER_API_BASE_URL,
  };
};

export default getConfig();
