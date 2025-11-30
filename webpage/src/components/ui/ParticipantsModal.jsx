// src/components/ui/ParticipantsModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import { fetchEventParticipants } from '../../services/admin/eventService';
import Spinner from './Spinner';

export default function ParticipantsModal({ isOpen, eventId, onClose }) {
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    studentName: '',
    parentName: '',
    relationType: '',
  });
  const [page, setPage] = useState(1);
  const limit = 10;

  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchEventParticipants(eventId, {
        ...filters,
        page,
        limit,
      });
      setData(res.data);
      setTotal(res.total);
    } catch (err) {
      toast(err.message, 'error');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [eventId, filters, page, toast]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex z-50">
      <div
        className="absolute inset-0 bg-black opacity-40"
        onClick={onClose}
      />
      <div className="relative ml-auto w-2/3 bg-white h-full shadow-xl p-6 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Event Participants</h2>
          <button onClick={onClose} className="text-gray-500">
            <HiX className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Student name…"
            value={filters.studentName}
            onChange={e =>
              setFilters(f => ({ ...f, studentName: e.target.value }))
            }
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Parent name…"
            value={filters.parentName}
            onChange={e =>
              setFilters(f => ({ ...f, parentName: e.target.value }))
            }
            className="border p-2 rounded"
          />
          <select
            value={filters.relationType}
            onChange={e =>
              setFilters(f => ({ ...f, relationType: e.target.value }))
            }
            className="border p-2 rounded"
          >
            <option value="">All relations</option>
            <option value="biological">Biological</option>
            <option value="step">Step</option>
          </select>
          <button
            onClick={() => setPage(1)}
            className="bg-gray-200 p-2 rounded"
          >
            Apply
          </button>
        </div>

        <div className="relative flex-grow overflow-auto">
          {loading && <Spinner />}
          {!loading && data.length === 0 && (
            <p className="text-center text-gray-500">No participants found.</p>
          )}
          {!loading && data.length > 0 && (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {['Student', 'Class', 'School', 'Parent', 'Relation'].map(h => (
                    <th key={h} className="p-2 border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={`${row.student_id}-${row.parent_id}`}>
                    <td className="p-2 border">{row.student_name}</td>
                    <td className="p-2 border">{row.class_name}</td>
                    <td className="p-2 border">{row.school_name}</td>
                    <td className="p-2 border">{row.parent_name}</td>
                    <td className="p-2 border">{row.relationship_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-center items-center mt-4 space-x-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="p-2 border rounded disabled:opacity-50"
          >
            <HiChevronLeft />
          </button>
          <span>Page {page} of {totalPages || 1}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="p-2 border rounded disabled:opacity-50"
          >
            <HiChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}
