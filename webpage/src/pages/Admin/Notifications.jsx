// src/pages/Admin/Notifications.jsx
import React from 'react';
import useAdminNotifications from '../../features/notifications/useAdminNotifications';
import NotificationFilters from '../../components/ui/NotificationFilters';
import NotificationTable from '../../components/ui/NotificationTable';
import Spinner from '../../components/ui/Spinner';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

export default function Notifications() {
  const {
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
  } = useAdminNotifications();

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      <NotificationFilters filters={filters} setFilters={setFilters} />

      <div className="flex items-center mb-4">
        <label className="text-sm mr-2">Page Size:</label>
        <select
          value={limit}
          onChange={e => { setLimit(+e.target.value); setPage(1); }}
          className="border rounded p-1"
        >
          {[10,20,50].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <NotificationTable data={data} />
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          <HiChevronLeft className="inline mr-1" /> Prev
        </button>
        <span className="text-sm">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next <HiChevronRight className="inline ml-1" />
        </button>
      </div>
    </div>
  );
}
