// src/components/ui/SiblingTable.jsx
import React from 'react';

export default function SiblingTable({
  data,
  loading,
  page,
  limit,
  total,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="loader">Loading…</div>
          </div>
        )}
        <table className="w-full table-auto bg-white shadow-sm rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Student 1</th>
              <th className="px-4 py-2 text-left">Class 1</th>
              <th className="px-4 py-2 text-left">Student 2</th>
              <th className="px-4 py-2 text-left">Class 2</th>
              <th className="px-4 py-2 text-left">Relation</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={`${row.student1_id}-${row.student2_id}`}
                className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-2">{row.student1_name}</td>
                <td className="px-4 py-2">{row.class1}</td>
                <td className="px-4 py-2">{row.student2_name}</td>
                <td className="px-4 py-2">{row.class2}</td>
                <td className="px-4 py-2 capitalize">{row.relation_type}</td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                  No sibling relations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
