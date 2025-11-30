// src/services/dslrUploadService.js

const pool = require('../config/db');
const { uploadToPhotoContainer } = require('../config/azureBlob');
const ExifParser = require('exif-parser');
const { v4: uuidv4 } = require('uuid');

const MAX_GAP_MS = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 5;
const CAMERA_TZ_OFFSET_MIN = parseInt(process.env.CAMERA_TZ_OFFSET_MIN, 10) || 0;

/**
 * Bulk‐upload DSLR photos and auto‐map them to photo_sessions by timestamp.
 *
 * @returns {Promise<{ newCount: number, duplicateCount: number, details: Array<{fileName,sessionId,photoId}> }>}
 */
async function uploadDslrPhotos(eventId, files, adminId) {
  const { rows: sessions } = await pool.query(
    `SELECT id, student_ids, photo_type, created_at
       FROM photo_sessions
      WHERE event_id = $1`,
    [eventId]
  );
  if (!sessions.length) throw { status: 404, message: 'No photo sessions found for event' };

  function findClosestSession(photoTs) {
    const photoMs = photoTs.getTime();
    const candidates = sessions
      .map(s => {
        let raw = s.created_at.toString();
        if (!raw.endsWith('Z')) raw += 'Z';
        return { ...s, diff: photoMs - Date.parse(raw) };
      })
      .filter(s => s.diff >= 0 && s.diff <= MAX_GAP_MS)
      .sort((a, b) => a.diff - b.diff);
    return candidates[0] || null;
  }

  let newCount = 0;
  let duplicateCount = 0;
  const details = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    const settled = await Promise.allSettled(
      batch.map(async file => {
        // a) parse EXIF
        const exif = ExifParser.create(file.buffer).parse();
        const ts = exif.tags.DateTimeOriginal || exif.tags.CreateDate;
        if (!ts) throw new Error('Missing EXIF DateTimeOriginal/CreateDate');

        // b) build and adjust photoDate
        let photoDate = new Date(ts * 1000);
        if (CAMERA_TZ_OFFSET_MIN) {
          photoDate = new Date(photoDate.getTime() - CAMERA_TZ_OFFSET_MIN * 60000);
        }

        // c) match session
        const session = findClosestSession(photoDate);
        if (!session) {
          throw new Error(`No session within ${MAX_GAP_MS/60000}min of ${photoDate.toISOString()}`);
        }

        // d) upload blob
        const blobName = `event-${eventId}/photo-${uuidv4()}-${file.originalname}`;
        const fileUrl = await uploadToPhotoContainer(file.buffer, blobName, file.mimetype);

        // e) insert photo, skip duplicates
        const { rows: [photoRow] } = await pool.query(
          `INSERT INTO photos
             (event_id, photo_session_id, file_name, file_url, photo_type, added_by)
           VALUES ($1,$2,$3,$4,$5,$6)
           ON CONFLICT (event_id, file_name) DO NOTHING
           RETURNING id`,
          [eventId, session.id, file.originalname, fileUrl, session.photo_type, adminId]
        );

        if (!photoRow) {
          // duplicate
          return { duplicate: true };
        }

        // f) map students
        await Promise.all(
          session.student_ids.map(sid =>
            pool.query(
              `INSERT INTO photo_students(photo_id, student_id)
                 VALUES ($1,$2)
                 ON CONFLICT (photo_id, student_id) DO NOTHING`,
              [photoRow.id, sid]
            )
          )
        );

        return {
          duplicate: false,
          fileName: file.originalname,
          sessionId: session.id,
          photoId: photoRow.id
        };
      })
    );

    for (const r of settled) {
      if (r.status === 'fulfilled') {
        const v = r.value;
        if (v.duplicate) {
          duplicateCount++;
        } else {
          newCount++;
          details.push({ fileName: v.fileName, sessionId: v.sessionId, photoId: v.photoId });
        }
      } else {
        console.error('⛔ DSLR upload error:', r.reason);
      }
    }
  }

  return { newCount, duplicateCount, details };
}

module.exports = { uploadDslrPhotos };
