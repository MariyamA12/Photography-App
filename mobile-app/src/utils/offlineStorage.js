// src/utils/offlineStorage.js

import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@photogApp:';

/**
 * Clear only the server-driven data for a single event.
 * Leaves manual sessions intact.
 */
export async function clearEventData(eventId) {
  const keys = [
    `${PREFIX}event_${eventId}`,
    `${PREFIX}students_${eventId}`,
    `${PREFIX}qrcodes_${eventId}`,
    `${PREFIX}prefs_${eventId}`,
    // sessions_{eventId} is NOT included here so manual sessions persist
  ];
  await AsyncStorage.multiRemove(keys);
}

/**
 * Save core event data.
 */
export async function saveEvent(event) {
  await AsyncStorage.setItem(
    `${PREFIX}event_${event.id}`,
    JSON.stringify(event)
  );
}

/**
 * Save students array.
 */
export async function saveStudents(eventId, students) {
  await AsyncStorage.setItem(
    `${PREFIX}students_${eventId}`,
    JSON.stringify(students)
  );
}

/**
 * Save QR codes array.
 */
export async function saveQRCodes(eventId, qrCodes) {
  await AsyncStorage.setItem(
    `${PREFIX}qrcodes_${eventId}`,
    JSON.stringify(qrCodes)
  );
}

/**
 * Save photo preferences array.
 */
export async function savePhotoPrefs(eventId, prefs) {
  await AsyncStorage.setItem(
    `${PREFIX}prefs_${eventId}`,
    JSON.stringify(prefs)
  );
}

/**
 * Save or update one photo session object.
 * session = {
 *   session_id,         // string
 *   qrcode_id,          // integer or null
 *   photo_type,         // string
 *   student_ids,        // array of ints
 *   timestamp,          // ISO string
 *   status              // 'present' | 'absent'
 * }
 */
export async function savePhotoSession(eventId, session) {
  const key = `${PREFIX}sessions_${eventId}`;
  const raw = await AsyncStorage.getItem(key);
  const arr = raw ? JSON.parse(raw) : [];
  // remove any old entry with same session_id, then add new
  const filtered = arr.filter(s => s.session_id !== session.session_id);
  filtered.push(session);
  await AsyncStorage.setItem(key, JSON.stringify(filtered));
}

/**
 * Load core event data.
 */
export async function loadEvent(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}event_${eventId}`);
  return raw ? JSON.parse(raw) : null;
}

export async function loadStudents(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}students_${eventId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function loadQRCodes(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}qrcodes_${eventId}`);
  return raw ? JSON.parse(raw) : [];
}

export async function loadPhotoPrefs(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}prefs_${eventId}`);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Load all saved photo sessions (both QR and manual).
 */
export async function loadPhotoSessions(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}sessions_${eventId}`);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Build attendance from sessions + students.
 */
export async function loadAttendance(eventId) {
  const students = await loadStudents(eventId);
  const sessions = await loadPhotoSessions(eventId);
  return students.map(s => {
    const sess = sessions.find(ss => ss.student_ids.includes(s.id));
    return {
      student_id:   s.id,
      student_name: s.name,
      photo_type:   sess?.photo_type || null,
      timestamp:    sess?.timestamp || null,
      status:       sess?.status || null,
      qrcode_id:    sess?.qrcode_id ?? null,
    };
  });
}

/* NEW: persist & load last‐upload timestamp for sync‐upload endpoint */

/**
 * Save ISO timestamp of last successful sync‐upload
 */
export async function saveLastUpload(eventId, timestamp) {
  await AsyncStorage.setItem(`${PREFIX}lastUpload_${eventId}`, timestamp);
}

/**
 * Load timestamp of last successful sync‐upload
 */
export async function loadLastUpload(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}lastUpload_${eventId}`);
  return raw || null;
}

/**
 * Save ISO timestamp of last successful offline‐sync
 */
export async function saveLastSync(eventId, timestamp) {
  await AsyncStorage.setItem(`${PREFIX}lastSync_${eventId}`, timestamp);
}

/**
 * Load timestamp of last successful offline‐sync
 */
export async function loadLastSync(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}lastSync_${eventId}`);
  return raw || null;
}

/* NEW: persist & load last‐scan timestamp to enforce 1 min cooldown */

/**
 * Save ISO timestamp of last scan
 */
export async function saveLastScan(eventId, timestamp) {
  await AsyncStorage.setItem(`${PREFIX}lastScan_${eventId}`, timestamp);
}

/**
 * Load timestamp of last scan
 */
export async function loadLastScan(eventId) {
  const raw = await AsyncStorage.getItem(`${PREFIX}lastScan_${eventId}`);
  return raw || null;
}
