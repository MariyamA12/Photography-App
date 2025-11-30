// src/pages/Admin/Schools.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../features/toast/useToast';
import SchoolModal from '../../components/ui/SchoolModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { fetchSchools, deleteSchool } from '../../services/admin/schoolService';

export default function Schools() {
  const { toast } = useToast();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ search: '', sort: 'newest' });
  const [modal, setModal] = useState({ type: null, data: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSchools(filter);
      setSchools(data);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search name…"
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            className="border p-2 rounded"
          />
          <select
            value={filter.sort}
            onChange={e => setFilter(f => ({ ...f, sort: e.target.value }))}
            className="border p-2 rounded"
          >
            <option value="newest">Newest → Oldest</option>
            <option value="oldest">Oldest → Newest</option>
          </select>
        </div>
        <button
          onClick={() => setModal({ type: 'add', data: null })}
          className="flex items-center bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark"
        >
          <HiPlus className="w-5 h-5 mr-2" /> Add School
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : schools.length === 0 ? (
        <p>No schools found.</p>
      ) : (
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Address</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.map(s => (
              <tr key={s.id}>
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.address}</td>
                <td className="p-2 border">
                  {new Date(s.created_at).toLocaleString()}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => setModal({ type: 'edit', data: s })}
                    className="text-blue-600 hover:underline"
                  >
                    <HiPencil />
                  </button>
                  <button
                    onClick={() => setModal({ type: 'del', data: s })}
                    className="text-red-600 hover:underline"
                  >
                    <HiTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SchoolModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        initial={modal.type === 'edit' ? modal.data : null}
        onClose={didRefresh => {
          setModal({ type: null, data: null });
          if (didRefresh) load();
        }}
      />

      <ConfirmModal
        isOpen={modal.type === 'del'}
        message={`Delete "${modal.data?.name}"?`}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={async () => {
          try {
            await deleteSchool(modal.data.id);
            toast('School deleted', 'success');
            load();
          } catch (err) {
            toast(err.message, 'error');
          }
        }}
      />
    </div>
  );
}
