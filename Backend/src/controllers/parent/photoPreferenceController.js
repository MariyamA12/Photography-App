const { createPhotoPreference } = require('../../services/photoPreferenceService');

/**
 * POST /api/parent/photo-preferences
 */
exports.createPreference = async (req, res, next) => {
  try {
    const parentId = req.user.userId;
    const {
      event_id,
      student_id,
      preference_type,
      extra_student_ids,
    } = req.body;

    const pref = await createPhotoPreference({
      eventId:         event_id,
      parentId,
      studentId:       student_id,
      preferenceType:  preference_type,
      extraStudentIds: extra_student_ids,
    });

    return res.status(201).json({ data: pref });
  } catch (err) {
    console.error('Error creating photo preference:', err);
    return res.status(err.status || 500).json({ error: err.message });
  }
};
