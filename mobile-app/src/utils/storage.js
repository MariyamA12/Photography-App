// utils/storage.js

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

let storage = null;

if (Platform.OS === "web") {
  storage = {
    setItem: async (key, value) => {
      localStorage.setItem(key, value);
    },
    getItem: async (key) => {
      return localStorage.getItem(key);
    },
    removeItem: async (key) => {
      localStorage.removeItem(key);
    },
    clear: async () => {
      localStorage.clear();
    },
  };
} else {
  // Native: use AsyncStorage
  storage = AsyncStorage;
}

export default storage;
