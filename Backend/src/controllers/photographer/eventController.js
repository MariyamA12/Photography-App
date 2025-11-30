// src/controllers/photographer/eventController.js

const pool = require('../../config/db');
const { getEventById } = require('../../services/eventService');

/**
 * GET /api/photographer/events/:id
 */
exports.getEventDetails = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const ev = await getEventById(eventId);

    if (!ev) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Ensure photographer only accesses their own events
    if (ev.photographer_id !== req.user.userId) {
      return res.status(403).json({ error: 'Forbidden: not your event' });
    }

    // Fetch school name
    const schoolResult = await pool.query(
      'SELECT name FROM schools WHERE id = $1',
      [ev.school_id]
    );
    const schoolName = schoolResult.rows[0]?.name || null;

    // Only send photographer-relevant fields (no notifications)
    res.status(200).json({
      event: {
        id: ev.id,
        name: ev.name,
        description: ev.description,
        event_date: ev.event_date,
        school: {
          id: ev.school_id,
          name: schoolName,
        },
        photographer_id: ev.photographer_id,
        created_by: ev.created_by,
        created_at: ev.created_at,
        is_finished: ev.is_finished,
      },
    });
  } catch (err) {
    console.error('Get photographer event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

exports.finishEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const ev = await getEventById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    if (ev.photographer_id !== req.user.userId)
      return res.status(403).json({ error: 'Forbidden: not your event' });

    const { rows } = await pool.query(
      'UPDATE events SET is_finished = TRUE WHERE id = $1 RETURNING id, name, is_finished',
      [eventId]
    );
    return res.status(200).json({ event: rows[0] });
  } catch (err) {
    console.error('Finish event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
