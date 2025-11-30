// src/services/admin/schoolService.js

const BASE = '/api/admin/schools';

export async function fetchSchools({ search = '', sort = 'newest' } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  params.append('sort', sort);
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error('Failed to load schools');
  const { data } = await res.json();
  return data;
}

export async function createSchool(payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create school');
  }
  return res.json();
}

export async function updateSchool(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update school');
  }
  return res.json();
}

export async function deleteSchool(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete school');
  }
}
