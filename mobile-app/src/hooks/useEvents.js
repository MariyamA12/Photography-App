// src/hooks/useEvents.js
import { useState, useEffect, useCallback } from 'react';
import { fetchPhotographerEvents } from '../api/events';

export default function useEvents() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPhotographerEvents();
      setEvents(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return { events, loading, error, refetch: loadEvents };
}
