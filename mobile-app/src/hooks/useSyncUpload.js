// src/hooks/useSyncUpload.js

import { useState, useEffect, useCallback } from "react";
import Toast from "react-native-toast-message";
import {
  loadPhotoSessions,
  saveLastUpload,
  loadLastUpload,
} from "../utils/offlineStorage";
import syncApi from "../api/sync"; // ← default import now

export default function useSyncUpload(eventId) {
  const [uploading, setUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState(null);

  useEffect(() => {
    (async () => {
      const ts = await loadLastUpload(eventId);
      if (ts) setLastUpload(ts);
    })();
  }, [eventId]);

  const upload = useCallback(async () => {
    setUploading(true);
    try {
      const sessions = await loadPhotoSessions(eventId);
      if (!sessions.length) {
        Toast.show({ type: "info", text1: "No local sessions to send" });
        return;
      }

      // ← call via default export
      const result = await syncApi.uploadSessions(eventId, sessions);

      const now = new Date().toISOString();
      await saveLastUpload(eventId, now);
      setLastUpload(now);

      Toast.show({
        type: "success",
        text1: "Upload complete",
        text2: `${result.totalSessions} sessions, ${result.totalAttendance} attendance`,
      });
    } catch (err) {
      console.error("Upload failed:", err);
      Toast.show({ type: "error", text1: "Upload failed", text2: err.message });
    } finally {
      setUploading(false);
    }
  }, [eventId]);

  return { upload, uploading, lastUpload };
}
