// src/pages/Admin/Users.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '../../features/toast/useToast';
import { fetchUsers, deleteUser } from '../../services/admin/userService';
import UserModal from '../../components/ui/UserModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Spinner from '../../components/ui/Spinner';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { roles } from '../../constants/roles';

export default function Users() {
  const { toast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState('newest');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Data + loading + modal state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ type: null, data: null });

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, role, sort]);

  // Load users whenever filters or page change
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchUsers({ search, role, sort, page });
      const list = Array.isArray(response.data) ? response.data : [];
      setUsers(list.filter(u => u.role !== 'admin'));
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      toast(err.message, 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, role, sort, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      {/* Filters */}
      <div className="flex justify-between mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border p-2 rounded"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">All roles</option>
            <option value={roles.PARENT}>Parent</option>
            <option value={roles.PHOTOGRAPHER}>Photographer</option>
          </select>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
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
          <HiPlus className="w-5 h-5 mr-2" /> Add User
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner />
      ) : !users.length ? (
        <p>No users found.</p>
      ) : (
        <>
          <table className="w-full table-auto border-collapse mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="p-2 border">{u.name}</td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border">
                    {new Date(u.created_at).toLocaleString()}
                  </td>
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() => setModal({ type: 'edit', data: u })}
                      className="text-blue-600 hover:underline"
                    >
                      <HiPencil />
                    </button>
                    <button
                      onClick={() => setModal({ type: 'del', data: u })}
                      className="text-red-600 hover:underline"
                    >
                      <HiTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modals */}
      <UserModal
        isOpen={modal.type === 'add' || modal.type === 'edit'}
        initial={modal.type === 'edit' ? modal.data : null}
        onClose={didRefresh => {
          setModal({ type: null, data: null });
          if (didRefresh) load();
        }}
      />
      <ConfirmModal
        isOpen={modal.type === 'del'}
        message={`Delete "${modal.data?.name}"?`}
        onClose={() => setModal({ type: null, data: null })}
        onConfirm={async () => {
          try {
            await deleteUser(modal.data.id);
            toast('User deleted', 'success');
            load();
          } catch (err) {
            toast(err.message, 'error');
          }
        }}
      />
    </div>
  );
}
