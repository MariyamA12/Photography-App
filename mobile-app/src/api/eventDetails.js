// src/api/eventDetails.js
import api from "./axios";

/**
 * Fetch details for a specific event.
 * GET /api/photographer/events/:id
 */
export async function fetchEventDetails(eventId) {
  const { data } = await api.get(`/photographer/events/${eventId}`);

  return data.event;
}
