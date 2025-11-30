import React from 'react';

export default function NotificationTable({ data }) {
  return (
    <table className="min-w-full bg-white border-collapse">
      <thead>
        <tr>
          {['Date','Subject','Recipient','Role','Event','School','Type'].map(h => (
            <th key={h} className="px-4 py-2 border-b text-left text-sm font-medium">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map(n => (
          <tr key={n.id} className="hover:bg-gray-50">
            <td className="px-4 py-2 border-b text-sm">{new Date(n.sentAt).toLocaleString()}</td>
            <td className="px-4 py-2 border-b text-sm">{n.subject}</td>
            <td className="px-4 py-2 border-b text-sm">{n.userName}</td>
            <td className="px-4 py-2 border-b text-sm">{n.userRole}</td>
            <td className="px-4 py-2 border-b text-sm">{n.eventName}</td>
            <td className="px-4 py-2 border-b text-sm">{n.schoolName}</td>
            <td className="px-4 py-2 border-b text-sm">{n.type}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

