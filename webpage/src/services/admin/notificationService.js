// src/services/admin/notificationService.js

/**
 * Fetch paginated admin notifications with filters.
 *
 * @param {Object} params
 * @param {string} [params.type]            – Filter by notification type
 * @param {string} [params.recipientRole]   – Filter by recipient role
 * @param {string} [params.eventName]       – Filter by event name
 * @param {string} [params.schoolName]      – Filter by school name
 * @param {string} [params.from]            – ISO date string (start)
 * @param {string} [params.to]              – ISO date string (end)
 * @param {number} [params.page=1]          – Page number
 * @param {number} [params.limit=10]        – Items per page
 *
 * @returns {Promise<{ data: Array, total: number, page: number, limit: number }>}
 */
export async function fetchAdminNotifications(params = {}) {
  // Build the query string
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val != null && val !== '') {
      query.append(key, String(val));
    }
  });

  // Call the API endpoint
  const res = await fetch(`/api/admin/notifications?${query.toString()}`, {
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Failed to fetch notifications: ${text}`);
  }

  // Expect JSON: { data, total, page, limit }
  return res.json();
}
