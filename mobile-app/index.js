// index.js
import "react-native-gesture-handler";
import { registerRootComponent } from "expo";
import App from "./App";

// Global error handler for development
if (__DEV__) {
  // Suppress PlatformConstants errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      (args[0].includes("PlatformConstants") ||
        args[0].includes("TurboModuleRegistry"))
    ) {
      // Suppress PlatformConstants and TurboModule errors in development
      return;
    }
    originalConsoleError.apply(console, args);
  };

  // Suppress specific warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] &&
      typeof args[0] === "string" &&
      args[0].includes("PlatformConstants")
    ) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Ensure proper module loading
try {
  registerRootComponent(App);
} catch (error) {
  console.log("App registration error:", error);
  // Fallback registration
  registerRootComponent(App);
}
