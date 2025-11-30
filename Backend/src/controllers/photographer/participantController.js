// src/controllers/photographer/participantController.js

const { getEventParticipants } = require('../../services/eventService');

/**
 * GET /api/photographer/events/:id/participants
 */
exports.listParticipants = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      studentName = '',
      parentName  = '',
      relationType,
      page        = '1',
      limit       = '10',
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
    console.error('List participants error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
