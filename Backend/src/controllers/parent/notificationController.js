// src/controllers/parent/notificationController.js
const { getParentNotifications } = require('../../services/parents/notificationService');

/**
 * GET /parent/notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, from, to, page = 1, limit = 10 } = req.query;

    const result = await getParentNotifications({
      userId,
      type,
      from,
      to,
      page:  parseInt(page,  10),
      limit: parseInt(limit, 10),
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Fetch parent notifications error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
