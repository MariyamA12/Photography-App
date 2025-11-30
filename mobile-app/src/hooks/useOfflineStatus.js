// src/hooks/useOfflineStatus.js

import { useState, useEffect } from "react";
import { loadEvent } from "../utils/offlineStorage";

/**
 * Returns a boolean: true if an event has been saved locally.
 * Re-checks whenever eventId or reloadFlag changes.
 */
export default function useOfflineStatus(eventId, reloadFlag = false) {
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ev = await loadEvent(eventId);
        if (!cancelled) {
          setIsSynced(ev !== null);
        }
      } catch {
        if (!cancelled) setIsSynced(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, reloadFlag]);

  return isSynced;
}
