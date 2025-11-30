// src/services/admin/parentStudentService.js
const BASE = '/api/admin/parent-student';

export async function fetchParentStudentLinks({
  parentId,
  studentId,
  parentName,
  studentName,
  schoolId,
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();
  if (parentId)    params.append('parentId', parentId);
  if (studentId)   params.append('studentId', studentId);
  if (parentName)  params.append('parentName', parentName);
  if (studentName) params.append('studentName', studentName);
  if (schoolId)    params.append('schoolId', schoolId);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${BASE}?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load parent‐student links');
  return res.json(); // expects { data: [...], total: number }
}

export async function createParentStudentLink({ parent_id, student_id, relationship_type }) {
  const res = await fetch(BASE, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ parent_id, student_id, relationship_type }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to link parent to student');
  }
  return res.json();
}

export async function deleteParentStudentLink(parentId, studentId) {
  const res = await fetch(`${BASE}/${parentId}/${studentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to unlink parent and student');
  }
}
