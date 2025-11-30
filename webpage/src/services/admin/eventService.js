const BASE = "/api/admin/events";

export async function fetchEvents(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") qp.append(k, v);
  });
  const res = await fetch(`${BASE}?${qp}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json(); // { data, total, page, limit }
}

export async function fetchEventById(id) {
  const res = await fetch(`${BASE}/${id}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load event");
  const { event } = await res.json();
  return event;
}

export async function createEvent(payload) {
  const res = await fetch(BASE, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create event");
  }
  return (await res.json()).event;
}

export async function updateEvent(id, payload) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update event");
  }
  return (await res.json()).event;
}

export async function deleteEvent(id) {
  const res = await fetch(`${BASE}/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete event");
  }
}

/**
 * Fetch participants (students + parents) for an event.
 */
export async function fetchEventParticipants(
  eventId,
  { studentName = "", parentName = "", relationType = "", page = 1, limit = 10 } = {}
) {
  const params = new URLSearchParams();
  if (studentName)  params.append("studentName", studentName);
  if (parentName)   params.append("parentName", parentName);
  if (relationType) params.append("relationType", relationType);
  params.append("page", page);
  params.append("limit", limit);

  const res = await fetch(`${BASE}/${eventId}/participants?${params}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to load participants");
  }
  return res.json(); // { data, total, page, limit }
}

/**
 * Immediately notify assigned photographer
 */
export async function notifyPhotographer(eventId) {
  const res = await fetch(`${BASE}/${eventId}/notify-photographer`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to notify photographer");
  }
  return res.json(); // { message, event }
}

/**
 * Immediately notify all parents
 */
export async function notifyParents(eventId) {
  const res = await fetch(`${BASE}/${eventId}/notify-parents`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to notify parents");
  }
  return res.json(); // { message, event }
}
