// src/services/admin/photoService.js

const BASE = "/api/admin/photos";

export async function fetchPhotosList(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qp.append(k, v);
  });
  const res = await fetch(`${BASE}?${qp}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load photos");
  return res.json(); // { data, total, page, limit }
}

export async function deletePhoto(photoId) {
  const res = await fetch(`${BASE}/${photoId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Delete failed");
  }
}

/**
 * Bulk DSLR/phone upload
 * @param {{ eventId: number, files: File[], sessionId?: number|null }} params
 * Returns { newCount, duplicateCount, details }
 */
export async function uploadBulkPhotos({ eventId, files, sessionId = null }) {
  const form = new FormData();
  files.forEach((file) => {
    form.append("photos", file, file.name);
  });

  const qp = new URLSearchParams();
  if (sessionId) qp.append("session_id", sessionId);

  const url = `/api/admin/events/${eventId}/upload-dslr-photos${qp.toString() ? `?${qp}` : ""}`;
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Bulk upload failed");
  }
  // backend returns: { newCount, duplicateCount, details }
  return res.json();
}
