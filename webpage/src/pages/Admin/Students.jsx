// src/pages/Admin/Students.jsx
import React, { useEffect, useState } from 'react';
import { useToast } from '../../features/toast/useToast';
import {
  fetchStudents,
  deleteStudent,
} from '../../services/admin/studentService';
import StudentModal from '../../components/ui/StudentModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function Students() {
  const { toast } = useToast();

  // list + pagination state
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);

  // filter + pagination in one object
  const [filter, setFilter] = useState({
    search: '',
    sort: 'newest',
    schoolName: '',
    className: '',
    page: 1,
    limit: 10,
  });

  // modal state
  const [modal, setModal] = useState({ type: null, data: null });

  // load data whenever filter changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data, total: tot } = await fetchStudents(filter);
        setItems(data);
        setTotal(tot);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter, toast]);

  const totalPages = Math.ceil(total / filter.limit);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap justify-between mb-4 space-y-2">
        <div className="flex flex-wrap space-x-2">
          <input
            placeholder="Search name…"
            value={filter.search}
            onChange={e =>
              setFilter(f => ({ ...f, search: e.target.value, page: 1 }))
            }
            className="border p-2 rounded"
          />
          <input
            placeholder="School name…"
            value={filter.schoolName}
            onChange={e =>
              setFilter(f => ({ ...f, schoolName: e.target.value, page: 1 }))
            }
            className="border p-2 rounded"
          />
          <input
            placeholder="Class…"
            value={filter.className}
            onChange={e =>
              setFilter(f => ({ ...f, className: e.target.value, page: 1 }))
            }
            className="border p-2 rounded"
          />
          <select
            value={filter.sort}
            onChange={e =>
              setFilter(f => ({ ...f, sort: e.target.value, page: 1 }))
            }
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
          <HiPlus className="w-5 h-5 mr-2" /> Add Student
        </button>
      </div>

      {/* Table or Loading / No Data */}
      {loading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Class</th>
                <th className="p-2 border">School</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(s => (
                <tr key={s.id}>
                  <td className="p-2 border">{s.name}</td>
                  <td className="p-2 border">{s.class_name}</td>
                  <td className="p-2 border">{s.school_name}</td>
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

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div>
              Page {filter.page} of {totalPages}
            </div>
            <div className="space-x-2">
              <button
                disabled={filter.page <= 1}
                onClick={() =>
                  setFilter(f => ({ ...f, page: f.page - 1 }))
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={filter.page >= totalPages}
                onClick={() =>
                  setFilter(f => ({ ...f, page: f.page + 1 }))
                }
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <StudentModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        initial={modal.type === 'edit' ? modal.data : null}
        onClose={didRefresh => {
          setModal({ type: null, data: null });
          if (didRefresh) {
            setFilter(f => ({ ...f, page: 1 }));
          }
        }}
      />

      <ConfirmModal
        isOpen={modal.type === 'del'}
        message={`Delete "${modal.data?.name}"?`}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={async () => {
          try {
            await deleteStudent(modal.data.id);
            toast('Student deleted', 'success');
            setFilter(f => ({ ...f }));
          } catch (err) {
            toast(err.message, 'error');
          }
        }}
      />
    </div>
  );
}
