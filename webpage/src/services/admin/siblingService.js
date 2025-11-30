// src/services/admin/siblingService.js
const BASE = '/api/admin/sibling-relations';

/**
 * Fetch paginated list of sibling relations.
 *
 * @param {Object} opts
 * @param {string} opts.studentName      Filter by student name (partial match)
 * @param {'biological'|'step'} opts.relationType  Filter by relationship type
 * @param {number} opts.schoolId         Filter by school ID
 * @param {number} opts.page             Page number (1-based)
 * @param {number} opts.limit            Items per page
 * @returns {Promise<{ data: Array, total: number }>}
 */
export async function fetchSiblings({
  studentName = '',
  relationType = '',
  schoolId,
  page = 1,
  limit = 10,
} = {}) {
  const params = new URLSearchParams();
  if (studentName)   params.append('studentName', studentName);
  if (relationType)  params.append('relation_type', relationType);
  if (schoolId)      params.append('schoolId', schoolId);
  params.append('page', page);
  params.append('limit', limit);

  const res = await fetch(`${BASE}?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || 'Failed to load sibling relations');
  }
  return res.json(); // { data: [...], total: number }
}
