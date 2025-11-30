// src/services/qrCodeService.js
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateQRCodeImage } = require('../utils/generateQRCode');
const { uploadBufferToBlob, downloadBlobToBuffer } = require('../config/azureBlob');
const archiver = require('archiver');

/**
 * Generate QR codes for an event.
 * - Uses photo_preferences if present, else defaults to every student individually.
 * - Persists student_ids array (as integer[]) and image_url.
 */
async function generateQRCodes(eventId) {
  // 1. Prevent duplicate generation
  const { rowCount } = await pool.query(
    'SELECT 1 FROM qrcodes WHERE event_id = $1',
    [eventId]
  );
  if (rowCount > 0) {
    const err = new Error('QR codes already generated for this event');
    err.status = 400;
    throw err;
  }

  // 2. Load preferences
  const { rows: prefs } = await pool.query(
    `SELECT id, student_id, extra_student_ids, preference_type
       FROM photo_preferences
      WHERE event_id = $1`,
    [eventId]
  );

  // 3. Build jobs list
  let jobs = prefs.map(pref => ({
    preferenceId: pref.id,
    photoType: pref.preference_type,
    studentIds: [pref.student_id, ...(pref.extra_student_ids || [])],
  }));

  // 4. If no preferences, default individual for each student
  if (jobs.length === 0) {
    const { rows: studs } = await pool.query(
      `SELECT s.id
         FROM students s
         JOIN events e ON e.school_id = s.school_id
        WHERE e.id = $1`,
      [eventId]
    );
    jobs = studs.map(s => ({
      preferenceId: null,
      photoType: 'individual',
      studentIds: [s.id],
    }));
  }

  // 5. Bulk insert into qrcodes, casting student_ids to integer[]
  const placeholders = [];
  const params = [];
  let idx = 1;

  for (const job of jobs) {
    const code = uuidv4();
    const payload = JSON.stringify({ eventId, code, studentIds: job.studentIds });
    const buffer = await generateQRCodeImage(payload);
    const blobName = `event-${eventId}/qr-${code}.png`;
    const imageUrl = await uploadBufferToBlob(buffer, blobName);

    // push params: event_id, preference_id, code, photo_type, student_ids, image_url
    params.push(
      eventId,
      job.preferenceId,
      code,
      job.photoType,
      job.studentIds,
      imageUrl
    );

    // placeholder using ::int[] cast for the array param
    placeholders.push(
      `($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}::int[], $${idx++})`
    );
  }

  const insertSql = `
    INSERT INTO qrcodes
      (event_id, preference_id, code, photo_type, student_ids, image_url)
    VALUES ${placeholders.join(', ')};  
  `;
  await pool.query(insertSql, params);
}

/**
 * Retrieve QR codes for an event with optional filters.
 * Returns each QR plus a JSONB `students` array of { id, name }.
 */
async function getQRCodesByEvent(eventId, { studentName, photoType, isScanned, page, limit }) {
  const clauses = ['q.event_id = $1'];
  const values = [eventId];
  let idx = 2;

  if (photoType) {
    clauses.push(`q.photo_type = $${idx}`);
    values.push(photoType);
    idx++;
  }
  if (isScanned !== undefined) {
    clauses.push(`q.is_scanned = $${idx}`);
    values.push(isScanned);
    idx++;
  }
  if (studentName) {
    clauses.push(`s.name ILIKE $${idx}`);
    values.push(`%${studentName}%`);
    idx++;
  }

  const where = `WHERE ${clauses.join(' AND ')}`;
  const offset = (page - 1) * limit;

  const dataQuery = `
    SELECT
      q.id,
      q.code,
      q.photo_type,
      q.image_url,
      q.is_scanned,
      q.scanned_at,
      q.scanned_by,
      q.student_ids,
      COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object('id', s.id, 'name', s.name)
          )
          FROM UNNEST(q.student_ids) AS sid
          JOIN students s ON s.id = sid
        ),
        '[]'::jsonb
      ) AS students
    FROM qrcodes q
    ${where}
    ORDER BY q.id
    LIMIT $${idx} OFFSET $${idx + 1}
  `;
  values.push(limit, offset);

  const { rows: data } = await pool.query(dataQuery, values);

  const countQuery = `
    SELECT COUNT(*) AS count
    FROM qrcodes q
    ${where}
  `;
  const { rows: countRows } = await pool.query(countQuery, values.slice(0, idx - 1));
  const total = parseInt(countRows[0].count, 10);

  return { data, total, page, limit };
}

/**
 * Stream all QR PNGs for an event as a ZIP download.
 */
async function downloadAllQRCodesAsZip(eventId, res) {
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="event-${eventId}-qrcodes.zip"`,
  });

  const archive = archiver('zip', { zlib: { level: 9 } });
  archive.on('error', err => { throw err; });
  archive.pipe(res);

  const { rows } = await pool.query(
    'SELECT code, image_url FROM qrcodes WHERE event_id = $1',
    [eventId]
  );

  for (const { code, image_url } of rows) {
    const url = new URL(image_url);
    // note: use the QR container name here, not a generic blob name
    const blobPath = url.pathname.split(`/${process.env.AZURE_QR_CONTAINER_NAME}/`).pop();
    const buffer = await downloadBlobToBuffer(blobPath);
    archive.append(buffer, { name: `qr-${code}.png` });
  }

  await archive.finalize();
}

module.exports = {
  generateQRCodes,
  getQRCodesByEvent,
  downloadAllQRCodesAsZip,
};
