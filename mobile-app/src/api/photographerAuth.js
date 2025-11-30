import storage from "../utils/storage";
import axios from "axios";

const BASE = `http://${process.env.EXPO_PUBLIC_IPCONFIG}/api/photographer`;

export async function login(email, password) {
  // POST /api/photographer/login
  const { data } = await axios.post(`${BASE}/login`, { email, password });
  await storage.setItem("accessToken", data.accessToken);
  await storage.setItem("refreshToken", data.refreshToken);
  return data.user;
}

export async function logout() {
  // Simply clear the tokens locally (no server call)
  await storage.removeItem("accessToken");
  await storage.removeItem("refreshToken");
}
