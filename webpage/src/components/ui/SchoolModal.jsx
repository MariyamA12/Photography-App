import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import { createSchool, updateSchool } from '../../services/admin/schoolService';

export default function SchoolModal({ isOpen, onClose, initial }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setAddress(initial.address || '');
    } else {
      setName('');
      setAddress('');
    }
  }, [initial, isOpen]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (initial) {
        await updateSchool(initial.id, { name, address });
        toast('School updated', 'success');
      } else {
        await createSchool({ name, address });
        toast('School created', 'success');
      }
      onClose(true);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* overlay */}
      <div className="absolute inset-0 bg-black opacity-50" onClick={() => onClose(false)} />
      {/* panel */}
      <div className="relative ml-auto w-1/4 bg-white h-full shadow-xl p-6 flex flex-col">
        <button onClick={() => onClose(false)} className="self-end text-gray-500">
          <HiX className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {initial ? 'Edit School' : 'Add School'}
        </h2>
        <label className="mb-2">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="border p-2 mb-4 rounded"
        />
        <label className="mb-2">Address (optional)</label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          className="border p-2 mb-4 rounded"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-auto bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
