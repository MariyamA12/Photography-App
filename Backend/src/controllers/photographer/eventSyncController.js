// src/controllers/photographer/eventSyncController.js
const {
  syncEventData,
  syncUpload,
} = require("../../services/photographer/eventSyncService");

/**
 * GET /api/photographer/events/:id/sync
 */
exports.syncEvent = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const photographerId = req.user.userId;
    const payload = await syncEventData(eventId, photographerId);
    res.status(200).json(payload);
  } catch (err) {
    console.error("Sync event error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

/**
 * POST /api/photographer/events/:id/sync-upload
 */
exports.syncUploadData = async (req, res) => {
  console.log(
    `📥 [DEBUG] sync-upload for event ${req.params.id} received at ${new Date().toISOString()}:`,
    JSON.stringify(req.body, null, 2)
  );

  try {
    const eventId = parseInt(req.params.id, 10);
    const photographerId = req.user.userId;
    const { sessions } = req.body;

    // ensure event exists & belongs to this photographer
    await syncEventData(eventId, photographerId);

    const result = await syncUpload(eventId, photographerId, sessions);

    res.status(200).json({ message: "Sync successful", ...result });
  } catch (err) {
    console.error("Sync upload error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
