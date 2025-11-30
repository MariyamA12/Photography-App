import React from 'react';
import { useToast } from '../../features/toast/useToast';

export default function Toast() {
  const { message, type, clear } = useToast();
  if (!message) return null;

  const bgClass =
    type === 'success'
      ? 'bg-green-100 text-green-800'
      : type === 'error'
      ? 'bg-red-100 text-red-800'
      : 'bg-blue-100 text-blue-800';

  return (
    <div
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      onClick={clear}
    >
      <div className={`${bgClass} pointer-events-auto px-4 py-2 rounded shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
