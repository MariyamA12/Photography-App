// src/api/schools.js
import api from './axios';

/**
 * Fetch list of schools for the photographer (always returns an array).
 */
export async function fetchSchools() {
  try {
    const resp = await api.get('/photographer/schools');
    const data = resp.data;
    // resp.data might be an array, or { success, data: [...] }
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];         // fallback empty
  } catch (err) {
    console.warn('fetchSchools error', err);
    return [];         // on error also return empty
  }
}
