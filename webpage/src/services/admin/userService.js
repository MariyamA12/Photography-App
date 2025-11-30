// src/services/admin/userService.js
const BASE = '/api/admin/users';

export async function fetchUsers({ search = '', role = '', sort = 'newest', page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role)   params.append('role', role);
  params.append('sort', sort);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${BASE}?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json(); // { data, total, page, totalPages }
}

export async function createUser(payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete user');
  }
}
