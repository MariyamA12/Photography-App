import React from 'react';
import { HiX } from 'react-icons/hi';

export default function ConfirmModal({ isOpen, onClose, onConfirm, message }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-50" onClick={() => onClose()} />
      <div className="bg-white p-6 rounded shadow-lg z-10 w-80">
        <button onClick={() => onClose()} className="text-gray-500 float-right">
          <HiX className="w-5 h-5" />
        </button>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={() => onClose()} className="px-4 py-2 rounded border">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
