// src/controllers/admin/eventController.js

const pool = require('../../config/db');
const {
  createEvent,
  getFilteredEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getEventParticipants,
  markPhotographerSentByButton,
  markParentsSentByButton,
} = require('../../services/eventService');
const {
  sendPhotographerAlert,
  sendParentsAlert,
} = require('../../services/emailService');

/**
 * POST /api/admin/events
 */
exports.create = async (req, res) => {
  try {
    const payload = { ...req.body, created_by: req.user.userId };
    const event = await createEvent(payload);
    res.status(201).json({ event });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/events
 */
exports.list = async (req, res) => {
  try {
    const result = await getFilteredEvents(req.query);
    const data = result.data.map(ev => ({
      ...ev,
      photographerButtonSent: ev.notify_photographer_button_sent,
      photographerButtonSentAt: ev.notify_photographer_button_sent_at,
      photographerJobSent: ev.notify_photographer_job_sent,
      photographerJobSentAt: ev.notify_photographer_job_sent_at,
      parentsButtonSent: ev.notify_parents_button_sent,
      parentsButtonSentAt: ev.notify_parents_button_sent_at,
      parentsJobSent: ev.notify_parents_job_sent,
      parentsJobSentAt: ev.notify_parents_job_sent_at,
    }));
    res.status(200).json({
      data,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (err) {
    console.error('List events error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/events/:id
 */
exports.getById = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const ev = await getEventById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });

    const now = Date.now();
    const eventTs = new Date(ev.event_date).getTime();
    const jobTs = eventTs - 7 * 24 * 60 * 60 * 1000;
    const msUntilJob = Math.max(jobTs - now, 0);

    res.status(200).json({
      event: {
        ...ev,
        photographerButtonSent: ev.notify_photographer_button_sent,
        photographerButtonSentAt: ev.notify_photographer_button_sent_at,
        photographerJobSent: ev.notify_photographer_job_sent,
        photographerJobSentAt: ev.notify_photographer_job_sent_at,
        parentsButtonSent: ev.notify_parents_button_sent,
        parentsButtonSentAt: ev.notify_parents_button_sent_at,
        parentsJobSent: ev.notify_parents_job_sent,
        parentsJobSentAt: ev.notify_parents_job_sent_at,
        timeUntilJobMs: msUntilJob,
      },
    });
  } catch (err) {
    console.error('Get event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * PATCH /api/admin/events/:id
 */
exports.update = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const updated = await updateEvent(eventId, req.body);
    res.status(200).json({ event: updated });
  } catch (err) {
    console.error('Update event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * DELETE /api/admin/events/:id
 */
exports.remove = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    await deleteEvent(eventId);
    res.status(204).end();
  } catch (err) {
    console.error('Delete event error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * GET /api/admin/events/:id/participants
 */
exports.getParticipants = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      studentName   = '',
      parentName    = '',
      relationType  = '',
      page          = '1',
      limit         = '10',
    } = req.query;

    const result = await getEventParticipants(eventId, {
      studentName,
      parentName,
      relationType,
      page:  parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Get event participants error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * POST /api/admin/events/:id/notify-photographer
 */
exports.sendPhotographerNotification = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const ev = await getEventById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    if (ev.notify_photographer_button_sent) {
      return res.status(400).json({ error: 'Photographer already notified' });
    }

    // fetch name + email for photographer
    const { rows: users } = await pool.query(
      'SELECT name, email FROM users WHERE id = $1',
      [ev.photographer_id]
    );
    if (!users.length) {
      return res.status(404).json({ error: 'Photographer user not found' });
    }
    const user = users[0];

    // send email
    await sendPhotographerAlert(ev, user.email, user.name);

    // mark as sent
    const updated = await markPhotographerSentByButton(eventId);
    res.json({ message: 'Photographer notified', event: updated });
  } catch (err) {
    console.error('Error notifying photographer:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * POST /api/admin/events/:id/notify-parents
 */
exports.sendParentsNotification = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const ev = await getEventById(eventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    if (ev.notify_parents_button_sent) {
      return res.status(400).json({ error: 'Parents already notified' });
    }

    // fetch all parent–child rows
    const { data } = await getEventParticipants(eventId, {
      page:  1,
      limit: 10000,
    });
    if (!data.length) {
      return res.status(404).json({ error: 'No parents found' });
    }

    // prepare rows for emailService grouping
    const rows = data.map(r => ({
      name:      r.parent_name,
      email:     r.parent_email,
      childName: r.student_name,
    }));

    // send grouped notification
    await sendParentsAlert(ev, rows);

    // mark as sent
    const updated = await markParentsSentByButton(eventId);
    res.json({ message: 'Parents notified', event: updated });
  } catch (err) {
    console.error('Error notifying parents:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
