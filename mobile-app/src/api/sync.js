// src/api/sync.js
import api from './axios';

/**
 * Send all locally stored sessions up to the server.
 * Expects { sessions: [...] } payload.
 */
async function uploadSessions(eventId, sessions) {
  const { data } = await api.post(
    `/photographer/events/${eventId}/sync-upload`,
    { sessions }
  );
  return data;
}

export default {
  uploadSessions,
};
