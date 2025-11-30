// App.js

import React from "react";
import { AuthProvider } from "./src/contexts/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";
import Toast from "react-native-toast-message";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigator />
        <Toast />
      </AuthProvider>
    </ErrorBoundary>
  );
}
