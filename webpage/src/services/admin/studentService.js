const BASE = '/api/admin/students';

/**
 * Fetch students with pagination & filters:
 * @param {object} opts
 * @param {string} opts.search
 * @param {string} opts.sort
 * @param {string} opts.schoolName
 * @param {string} opts.className
 * @param {number} opts.page
 * @param {number} opts.limit
 * @param {number} opts.schoolId      // ← new
 */
export async function fetchStudents({
  search = '',
  sort = 'newest',
  schoolName = '',
  className = '',
  page = 1,
  limit = 10,
  schoolId,          // ← new
} = {}) {
  const params = new URLSearchParams();
  if (search)     params.append('search', search);
  params.append('sort', sort);
  if (schoolName) params.append('schoolName', schoolName);
  if (className)  params.append('className', className);
  if (schoolId)   params.append('schoolId', schoolId);  // ← new
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${BASE}?${params.toString()}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to load students');
  }

  const body = await res.json();
  if (!body.success) {
    throw new Error(body.message || 'Failed to load students');
  }

  return {
    data: body.data,
    total: body.total,
    page: body.page,
    limit: body.limit,
  };
}

export async function createStudent(payload) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create student');
  }
  return res.json();
}

export async function updateStudent(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to update student');
  }
  return res.json();
}

export async function deleteStudent(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to delete student');
  }
}
