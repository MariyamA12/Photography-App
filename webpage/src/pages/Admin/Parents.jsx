// src/pages/Admin/Parents.jsx
import React, { useState, useEffect } from 'react';
import { useToast } from '../../features/toast/useToast';
import { useParents } from '../../features/parents/useParents';
import { deleteParentStudentLink } from '../../services/admin/parentStudentService';
import ParentModal from '../../components/ui/ParentModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import { fetchSchools } from '../../services/admin/schoolService';

export default function Parents() {
  const { toast } = useToast();

  // Filters & pagination
  const [filters, setFilters] = useState({
    parentName: '',
    studentName: '',
    schoolId: '',
    page: 1,
    limit: 10,
  });

  // Modal state & reload flag
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(false);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    message: '',
    parentId: null,
    studentId: null,
  });

  // Fetch schools for filter
  const [schools, setSchools] = useState([]);
  useEffect(() => {
    fetchSchools({ sort: 'newest' })
      .then(setSchools)
      .catch(err => toast(err.message, 'error'));
  }, [toast]);

  // Fetch data, including reloadFlag
  const { data, total, loading, error } = useParents({ ...filters, reload: reloadFlag });

  // Pagination calculation
  const totalPages = Math.ceil(total / filters.limit);

  // Convenience to update filters
  const updateFilters = updates => {
    setFilters(f => ({ ...f, ...updates, page: updates.page ?? f.page }));
  };

  // Open confirmation modal
  const promptUnlink = (parentId, studentId) => {
    setConfirmState({
      isOpen: true,
      message: 'Are you sure you want to unlink this student?',
      parentId,
      studentId,
    });
  };

  // Actual unlink action
  const handleUnlink = async (parentId, studentId) => {
    try {
      await deleteParentStudentLink(parentId, studentId);
      toast('Unlinked successfully', 'success');
      setReloadFlag(f => !f);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      {/* Filters & Add Button */}
      <div className="flex flex-wrap justify-between items-center mb-4 space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Parent name..."
            value={filters.parentName}
            onChange={e => updateFilters({ parentName: e.target.value, page: 1 })}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Student name..."
            value={filters.studentName}
            onChange={e => updateFilters({ studentName: e.target.value, page: 1 })}
            className="border p-2 rounded"
          />
          <select
            value={filters.schoolId}
            onChange={e => updateFilters({ schoolId: e.target.value, page: 1 })}
            className="border p-2 rounded"
          >
            <option value="">All schools</option>
            {schools.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsParentModalOpen(true)}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
        >
          Add Parent Link
        </button>
      </div>

      {/* Table Section */}
      <div className="border bg-white shadow rounded overflow-auto">
        <div className="relative">
          {/* Spinner overlay */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <Spinner />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="p-4 text-red-500">Error: {error.message}</p>
          )}

          {/* Results table */}
          {!error && (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Parent</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Student</th>
                  <th className="p-2 text-left">Class</th>
                  <th className="p-2 text-left">Relationship</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  data.map(row => (
                    <tr key={`${row.parent_id}-${row.student_id}`} className="border-t">
                      <td className="p-2">{row.parent_name}</td>
                      <td className="p-2">{row.email}</td>
                      <td className="p-2">{row.student_name}</td>
                      <td className="p-2">{row.class_name}</td>
                      <td className="p-2 capitalize">{row.relationship_type}</td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => promptUnlink(row.parent_id, row.student_id)}
                          className="text-red-500 hover:underline"
                        >
                          Unlink
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-4 space-x-3">
          <button
            onClick={() => updateFilters({ page: filters.page - 1 })}
            disabled={filters.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>Page {filters.page} of {totalPages}</span>
          <button
            onClick={() => updateFilters({ page: filters.page + 1 })}
            disabled={filters.page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
          <select
            value={filters.limit}
            onChange={e => updateFilters({ limit: +e.target.value, page: 1 })}
            className="border p-1 rounded"
          >
            {[5, 10, 20, 50].map(n => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        </div>
      )}

      {/* Add ParentLink Modal */}
      <ParentModal
        isOpen={isParentModalOpen}
        onClose={didSave => {
          setIsParentModalOpen(false);
          if (didSave) setReloadFlag(f => !f);
        }}
      />

      {/* Confirm Unlink Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        message={confirmState.message}
        onClose={() => setConfirmState(s => ({ ...s, isOpen: false }))}
        onConfirm={() => {
          handleUnlink(confirmState.parentId, confirmState.studentId);
        }}
      />
    </div>
  );
}
