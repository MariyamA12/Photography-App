// src/api/events.js
import api from './axios';

/**
 * Fetch paginated, filtered events for the logged-in photographer.
 * Expects backend to return { data: Event[], total, page, limit }.
 */
export async function fetchPhotographerEvents(params) {
  const { data } = await api.get('/photographer/events', { params });
  // data === { data: [...], total, page, limit }
  return data;
}
