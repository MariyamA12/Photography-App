// src/controllers/parent/photoController.js

const { getPhotosForParent } = require('../../services/parents/photoService');

/**
 * GET /parent/photos
 */
exports.listPhotosForParent = async (req, res) => {
  try {
    const parentId = req.user.userId;
    const {
      event_name,
      photo_type,
      student_name,
      from_date,
      to_date,
      page = 1,
      limit = 10,
    } = req.query;

    const { data, total } = await getPhotosForParent(parentId, {
      event_name,
      photo_type,
      student_name,
      from_date,
      to_date,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('List parent photos error:', err);
    res.status(500).json({ error: 'Failed to retrieve photos.' });
  }
};
