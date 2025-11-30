// src/api/notifications.js
import api from "./axios";

/**
 * Fetch paginated notifications for the logged-in photographer.
 */
export async function fetchNotifications({ page = 1, limit = 10 }) {
  try {
    const response = await api.get("/photographer/notifications", {
      params: { page, limit },
    });

    // The backend returns { data: [...], total, page, limit }
    if (response.data && response.data.data) {
      return response.data.data;
    }

    // Fallback for other response structures
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    return [];
  } catch (error) {
    console.error("fetchNotifications: Error:", error);
    throw error;
  }
}
