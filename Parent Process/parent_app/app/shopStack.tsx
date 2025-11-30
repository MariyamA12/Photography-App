import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Shop from "../app/(tabs)/shop";
import Cart from "./cart";
import Checkout from "./checkout";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: number;
  quantity: number;
  description: string;
};

export type RootStackParamList = {
  ShopMain: undefined;
  Cart: { cartItems: CartItem[] };
  Checkout: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function ShopStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ShopMain"
        component={Shop}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Cart"
        component={Cart}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Checkout"
        component={Checkout}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
