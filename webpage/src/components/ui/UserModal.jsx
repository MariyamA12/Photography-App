// src/components/ui/UserModal.jsx
import React, { useState, useEffect } from 'react';
import { HiX } from 'react-icons/hi';
import { useToast } from '../../features/toast/useToast';
import { roles } from '../../constants/roles';
import { createUser, updateUser } from '../../services/admin/userService';

export default function UserModal({ isOpen, onClose, initial }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: roles.PARENT,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initial) {
      setForm({
        name:  initial.name,
        email: initial.email,
        password: '',
        role:  initial.role,
      });
    } else {
      setForm({ name: '', email: '', password: '', role: roles.PARENT });
    }
  }, [initial, isOpen]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (initial) {
        // omit empty password on edit
        const { password, ...rest } = form;
        const payload = password
          ? { ...rest, password }
          : rest;
        await updateUser(initial.id, payload);
        toast('User updated', 'success');
      } else {
        await createUser(form);
        toast('User created', 'success');
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
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={() => onClose(false)}
      />
      <div className="relative ml-auto w-1/4 bg-white h-full shadow-xl p-6 flex flex-col">
        <button
          onClick={() => onClose(false)}
          className="self-end text-gray-500"
        >
          <HiX className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">
          {initial ? 'Edit User' : 'Add User'}
        </h2>

        <label className="mb-1">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="border p-2 mb-4 rounded"
        />

        <label className="mb-1">Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="border p-2 mb-4 rounded"
        />

        <label className="mb-1">
          {initial ? 'Password (leave blank to keep)' : 'Password'}
        </label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className="border p-2 mb-4 rounded"
        />

        <label className="mb-1">Role</label>
        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="border p-2 mb-6 rounded"
        >
          <option value={roles.PARENT}>Parent</option>
          <option value={roles.PHOTOGRAPHER}>Photographer</option>
        </select>

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
