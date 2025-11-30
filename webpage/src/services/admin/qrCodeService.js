// src/services/admin/qrCodeService.js
const BASE = "/api/admin/events";

export async function generateQrCodes(eventId) {
  const res = await fetch(`${BASE}/${eventId}/qrcodes/generate`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to generate QR codes");
  }
  return true;
}

export async function fetchQrCodes(
  eventId,
  {
    studentName = "",
    photoType = "",
    isScanned = "",
    page = 1,
    limit = 20,
  } = {}
) {
  const params = new URLSearchParams();
  if (studentName) params.append("studentName", studentName);
  if (photoType)  params.append("photoType", photoType);
  if (isScanned)  params.append("isScanned", isScanned);
  params.append("page", page);
  params.append("limit", limit);

  const res = await fetch(
    `${BASE}/${eventId}/qrcodes?${params.toString()}`,
    { credentials: "include" }
  );
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to load QR codes");
  }
  return res.json(); // { data, total, page, limit }
}

// ← UPDATED to actually fetch and return the Response
export async function downloadQrCodesZip(eventId) {
  const res = await fetch(
    `${BASE}/${eventId}/qrcodes/download`,
    { credentials: "include" }
  );
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error || "Failed to download ZIP");
  }
  return res;
}
