// src/hooks/useEventDetails.js
import { useState, useEffect, useCallback } from "react";
import { fetchEventDetails } from "../api/eventDetails";

export default function useEventDetails(eventId) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ev = await fetchEventDetails(eventId);
      setEvent(ev);
    } catch (err) {
      console.error("useEventDetails: API error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  return { event, loading, error, refetch: loadEvent };
}
