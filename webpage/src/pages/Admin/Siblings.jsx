// src/pages/Admin/Siblings.jsx
import React, { useState, useEffect } from 'react';
import { fetchSiblings } from '../../services/admin/siblingService';
import { fetchSchools } from '../../services/admin/schoolService';
import { useToast } from '../../features/toast/useToast';
import Spinner from '../../components/ui/Spinner';

export default function Siblings() {
  const { toast } = useToast();

  // Filters & pagination
  const [studentName, setStudentName] = useState('');
  const [relationType, setRelationType] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Data
  const [siblings, setSiblings] = useState([]);
  const [total, setTotal] = useState(0);
  const [schools, setSchools] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Fetch schools once
  useEffect(() => {
    setLoadingSchools(true);
    fetchSchools({ sort: 'newest' })
      .then(data => setSchools(data))
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoadingSchools(false));
  }, [toast]);

  // Fetch sibling relations on filter/page change
  useEffect(() => {
    setLoading(true);
    fetchSiblings({ studentName, relationType, schoolId, page, limit })
      .then(({ data, total }) => {
        setSiblings(data);
        setTotal(total);
      })
      .catch(err => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [studentName, relationType, schoolId, page, toast]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Sibling Relations</h1>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <input
          type="text"
          placeholder="Search student..."
          value={studentName}
          onChange={e => { setStudentName(e.target.value); setPage(1); }}
          className="border p-2 rounded flex-grow"
        />

        <select
          value={relationType}
          onChange={e => { setRelationType(e.target.value); setPage(1); }}
          className="border p-2 rounded"
        >
          <option value="">— All relations —</option>
          <option value="biological">Biological</option>
          <option value="step">Step</option>
        </select>

        <select
          value={schoolId}
          onChange={e => { setSchoolId(e.target.value); setPage(1); }}
          disabled={loadingSchools}
          className="border p-2 rounded"
        >
          <option value="">— All schools —</option>
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Student 1</th>
              <th className="p-3 text-left">Class 1</th>
              <th className="p-3 text-left">Student 2</th>
              <th className="p-3 text-left">Class 2</th>
              <th className="p-3 text-left">Relation</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center">
                  <Spinner />
                </td>
              </tr>
            ) : siblings.length ? (
              siblings.map(row => (
                <tr
                  key={`${row.student1_id}-${row.student2_id}`}
                  className="border-t"
                >
                  <td className="p-3">{row.student1_name}</td>
                  <td className="p-3">{row.class1}</td>
                  <td className="p-3">{row.student2_name}</td>
                  <td className="p-3">{row.class2}</td>
                  <td className="p-3 capitalize">{row.relation_type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No sibling relations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {totalPages || 1}</span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages || totalPages === 0}
          className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
