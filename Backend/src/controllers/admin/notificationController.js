// src/controllers/admin/notificationController.js
const { getAdminNotifications } = require('../../services/notificationService');

/**
 * GET /api/admin/notifications
 * Returns a paginated, filterable list of notifications that admin has sent
 * (to both parents and photographers).
 */
exports.getNotifications = async (req, res) => {
  try {
    const {
      type,
      recipientRole,
      eventId,
      schoolId,
      from,
      to,
      page = 1,
      limit = 10,
    } = req.query;

    const result = await getAdminNotifications({
      type,
      recipientRole,
      eventId:   eventId  ? parseInt(eventId,  10) : undefined,
      schoolId:  schoolId ? parseInt(schoolId, 10) : undefined,
      from,
      to,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
