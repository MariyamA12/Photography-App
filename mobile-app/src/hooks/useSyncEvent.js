import { useState, useCallback, useEffect } from "react";
import api from "../api/axios";
import Toast from "react-native-toast-message";
import {
  clearEventData,
  saveEvent,
  saveStudents,
  saveQRCodes,
  savePhotoPrefs,
  saveLastSync,
  loadLastSync,
} from "../utils/offlineStorage";

export default function useSyncEvent(eventId) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  // Load persisted last‐sync on mount
  useEffect(() => {
    (async () => {
      const ts = await loadLastSync(eventId);
      setLastSync(ts);
    })();
  }, [eventId]);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      // 1) clear old data
      await clearEventData(eventId);

      // 2) fetch fresh
      const resp = await api.get(`/photographer/events/${eventId}/sync`);
      const { event, students, qr_codes, photo_preferences } = resp.data;

      // 3) save locally
      await saveEvent(event);
      await saveStudents(eventId, students);
      await saveQRCodes(eventId, qr_codes);
      await savePhotoPrefs(eventId, photo_preferences);

      // 4) persist last‐sync timestamp
      const now = new Date().toISOString();
      await saveLastSync(eventId, now);
      setLastSync(now);

      Toast.show({ type: "success", text1: "Sync complete" });
    } catch (err) {
      console.error("Sync failed:", err);
      Toast.show({ type: "error", text1: "Sync failed", text2: err.message });
    } finally {
      setSyncing(false);
    }
  }, [eventId]);

  return { sync, syncing, lastSync };
}
