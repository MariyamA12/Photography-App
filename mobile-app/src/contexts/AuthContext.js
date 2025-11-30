// src/contexts/AuthContext.js

import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";
import {
  login as loginApi,
  logout as logoutApi,
} from "../api/photographerAuth";
import storage from "../utils/storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await storage.getItem("accessToken");
        if (token) {
          try {
            const { data } = await api.get("/photographer/profile");
            setUser(data);
          } catch (error) {
            console.log("Token validation failed:", error.message);
            // token invalid → clear it
            await logoutApi();
          }
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email, password) => {
    try {
      const user = await loginApi(email, password);
      setUser(user);
      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logoutApi();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if logout fails, clear local state
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
