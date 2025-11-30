// src/controllers/admin/attendanceController.js
const { getFilteredAttendance } = require('../../services/attendanceService');
const { Parser } = require('json2csv');

/**
 * GET /api/admin/attendance
 */
exports.listAttendance = async (req, res) => {
  try {
    const {
      event_id, school_id, student_name, photographer_id,
      photo_type, class_name, is_random,
      date_from, date_to, page = 1, limit = 10,
    } = req.query;

    const { data, total } = await getFilteredAttendance({
      event_id: parseInt(event_id, 10),
      school_id: school_id && parseInt(school_id, 10),
      student_name,
      photographer_id: photographer_id && parseInt(photographer_id, 10),
      photo_type,
      class_name,
      is_random,
      date_from,
      date_to,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('Error listing attendance:', err);
    res.status(500).json({ error: 'Failed to retrieve attendance records.' });
  }
};

/**
 * GET /api/admin/attendance/export
 */
exports.exportAttendance = async (req, res) => {
  try {
    const {
      event_id, school_id, student_name, photographer_id,
      photo_type, class_name, is_random,
      date_from, date_to,
    } = req.query;

    const { data } = await getFilteredAttendance({
      event_id: parseInt(event_id, 10),
      school_id: school_id && parseInt(school_id, 10),
      student_name,
      photographer_id: photographer_id && parseInt(photographer_id, 10),
      photo_type,
      class_name,
      is_random,
      date_from,
      date_to,
      page: 1,
      limit: Number.MAX_SAFE_INTEGER,
    });

    const fields = [
      { label: 'Session ID',      value: 'photo_session_id' },
      { label: 'Students',        value: row => row.student_ids.join(';') },
      { label: 'Status',          value: 'status' },
      { label: 'Timestamp',       value: row => row.marked_at.toISOString() },
      { label: 'Photo Type',      value: 'photo_type' },
      { label: 'QR Code ID',      value: 'qrcode_id' },
      { label: 'Photographer',    value: 'photographer_name' },
      { label: 'Event',           value: 'event_name' },
      { label: 'School ID',       value: 'school_id' },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance_export.csv');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting attendance:', err);
    res.status(500).json({ error: 'Failed to export attendance CSV.' });
  }
};
