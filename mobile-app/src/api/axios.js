// src/api/axios.js

import axios from "axios";
import storage from "../utils/storage";
import { logout as logoutApi } from "./photographerAuth";
import config from "../config/environment";

const api = axios.create({
  baseURL: `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api`,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If you ever get a 401, just clear local tokens and force a sign‑out
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await logoutApi(); // clear local tokens
      // optionally navigate back to login here
    }
    return Promise.reject(err);
  }
);

export default api;
