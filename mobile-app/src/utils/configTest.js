// src/utils/configTest.js

import config from "../config/environment";
import api from "../api/axios";

export const testApiConnection = async () => {
  try {
    // Test basic connectivity
    const response = await api.get("/health");
    console.log("✅ API connection successful:", response.status);
    return true;
  } catch (error) {
    console.error("❌ API connection failed:", error.message);
    console.error(
      "Please check your configuration in src/config/environment.js"
    );
    console.error("Or set environment variables in a .env file");
    return false;
  }
};

export const testPhotographerEndpoint = async () => {
  try {
    console.log("Testing photographer endpoint...");
    const response = await api.get("/photographer/health");
    console.log("✅ Photographer endpoint accessible:", response.status);
    return true;
  } catch (error) {
    console.error("❌ Photographer endpoint failed:", error.message);
    return false;
  }
};

export const logConfiguration = () => {
  console.log("📱 Mobile App Configuration:");
  console.log("Environment:", __DEV__ ? "Development" : "Production");
  console.log("API Base URL:", config.API_BASE_URL);
  console.log("Photographer API URL:", config.PHOTOGRAPHER_API_BASE_URL);
  console.log("Timeout:", config.TIMEOUT);
};
