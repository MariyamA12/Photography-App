// src/features/notifications/useAdminNotifications.js
import { useState, useEffect, useCallback } from 'react';
import { fetchAdminNotifications } from '../../services/admin/notificationService';


export default function useAdminNotifications() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    recipientRole: '',
    eventName: '',
    schoolName: '',
    from: '',
    to: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminNotifications({ ...filters, page, limit });
      setData(res.data);
      setTotal(res.total);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    total,
    page,
    limit,
    filters,
    setFilters,
    setPage,
    setLimit,
    loading,
    error,
  };
}
