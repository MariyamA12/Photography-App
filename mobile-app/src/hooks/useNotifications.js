// src/hooks/useNotifications.js
import { useState, useEffect, useCallback } from "react";
import { fetchNotifications } from "../api/notifications";

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifications({ page });

      setNotifications((prev) => (page === 1 ? result : [...prev, ...result]));
      setHasMore(result.length >= 10); // Default limit is 10
    } catch (err) {
      console.error("useNotifications: Error loading page", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const refresh = () => {
    setPage(1);
  };

  const loadMore = () => {
    if (hasMore && !loading) setPage((p) => p + 1);
  };

  return { notifications, loading, error, refresh, loadMore };
}
