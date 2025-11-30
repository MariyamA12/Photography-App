// src/hooks/usePaginatedEvents.js
import { useState, useEffect, useCallback } from "react";
import { fetchPhotographerEvents } from "../api/events";

export default function usePaginatedEvents(filters, pageSize = 10) {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadPage = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const targetPage = reset ? 1 : page;
        const resp = await fetchPhotographerEvents({
          page: targetPage,
          limit: pageSize,
          ...filters,
        });

        // Ensure resp is valid
        if (!resp) {
          console.warn("usePaginatedEvents: No response from API");
          if (reset) {
            setEvents([]);
          }
          setHasMore(false);
          return;
        }

        // backend returns { data, total, page, limit }
        const dataArr = Array.isArray(resp) ? resp : resp.data;

        // Ensure dataArr is always an array
        const safeDataArr = Array.isArray(dataArr) ? dataArr : [];

        // Filter out invalid events that don't have required properties
        const validEvents = safeDataArr.filter((event) => {
          if (!event || typeof event !== "object") {
            console.warn("usePaginatedEvents: Invalid event object", event);
            return false;
          }
          if (!event.id || !event.event_date) {
            console.warn(
              "usePaginatedEvents: Event missing required properties",
              event
            );
            return false;
          }
          return true;
        });

        if (reset) {
          setEvents(validEvents);
          setPage(1);
        } else {
          setEvents((prev) => [...(prev || []), ...validEvents]);
        }
        setHasMore(validEvents.length === pageSize);
      } catch (err) {
        console.error("usePaginatedEvents: Error loading page", err);
        setError(err);
        // Ensure events is still an array even on error
        if (reset) {
          setEvents([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters, page, pageSize]
  );

  // Initial / filter-change load
  useEffect(() => {
    loadPage(true);
  }, [filters, loadPage]);

  // Load more on page bump
  useEffect(() => {
    if (page > 1) loadPage();
  }, [page, loadPage]);

  return {
    events,
    loading,
    error,
    hasMore,
    loadMore: () => {
      if (!loading && hasMore) setPage((p) => p + 1);
    },
    refresh: () => loadPage(true),
  };
}
