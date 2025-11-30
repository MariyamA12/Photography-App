// src/services/admin/attendanceService.js
const BASE = "/api/admin/attendance";

export async function fetchAttendance(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qp.append(k, v);
  });
  const res = await fetch(`${BASE}?${qp}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load attendance");
  return res.json(); // { data, total, page, limit }
}

export async function exportAttendance(params = {}) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qp.append(k, v);
  });
  const res = await fetch(`${BASE}/export?${qp}`, {
    credentials: "include",
    headers: { Accept: "text/csv" },
  });
  if (!res.ok) throw new Error("Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}
