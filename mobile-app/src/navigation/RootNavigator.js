// src/navigation/RootNavigator.js

import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator } from "react-native";
import AuthStack from "./AuthStack";
import MainTabNavigator from "./MainTabNavigator";
import SplashScreen from "../screens/SplashScreen";
import { useAuth } from "../contexts/AuthContext";
import Colors from "../utils/colors";

export default function RootNavigator() {
  const { user, loading } = useAuth();
  const [splashComplete, setSplashComplete] = useState(false);

  const handleSplashComplete = () => {
    setSplashComplete(true);
  };

  // Show splash screen first
  if (!splashComplete) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
};
