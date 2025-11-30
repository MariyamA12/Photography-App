// src/components/ui/QrCodeTable.jsx
import React from 'react';

export default function QrCodeTable({ items = [] }) {
  if (!items.length) {
    return (
      <p className="text-center py-10 text-gray-500">
        No QR codes found.
      </p>
    );
  }

  return (
    <table className="w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          {["QR Image", "Code", "Students", "Type", "Scanned", "Scanned At"].map((h) => (
            <th key={h} className="p-2 border">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((q) => {
          // ensure students is always an array
          const students = Array.isArray(q.students) ? q.students : [];
          return (
            <tr key={q.id} className="hover:bg-gray-50">
              <td className="p-2 border">
                <img
                  src={q.image_url}
                  alt={`QR ${q.code}`}
                  className="w-16 h-16 object-cover rounded"
                />
              </td>
              <td className="p-2 border font-mono text-sm">{q.code}</td>
              <td className="p-2 border">
                {students.map((s) => s.name).join(", ")}
              </td>
              <td className="p-2 border">
                {(q.photo_type || "").replace("_", " ")}
              </td>
              <td className="p-2 border">
                {q.is_scanned ? "✅" : "❌"}
              </td>
              <td className="p-2 border">
                {q.scanned_at
                  ? new Date(q.scanned_at).toLocaleString()
                  : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
