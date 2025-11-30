import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { PeachyColors } from "../constants/Colors";
import { CartProvider } from "../contexts/CartContext";
import { StripeProvider } from "@stripe/stripe-react-native";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins: require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Sansation-Light": require("../assets/fonts/Sansation-Light.ttf"),
    "SixCaps-Regular": require("../assets/fonts/SixCaps-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen after the fonts have loaded (or an error was received)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until the fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Render the app with a fallback system font if there's an error
  return (
    <StripeProvider
      publishableKey="pk_test_51RvnbOFRoKVtK6zoe3oAGAFgfVtq5Whm1x6ZpggpuyqiT66N51b4PTrBj1TdFABhUkSbSpPMzOAv52LiHmUPUM6800H1i29mty" // your Stripe publishable key
      merchantIdentifier="merchant.com.test" // required for Apple Pay
      urlScheme="parentapp" // required for 3D Secure and bank redirects
      //merchantDisplayName="Roz and Kirsty"
    >
    <CartProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: "#f9f9f9",
          },
          headerTintColor: PeachyColors.primary,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </CartProvider>
    </StripeProvider>
  );
}
