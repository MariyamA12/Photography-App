// src/controllers/admin/photoController.js

const photoService = require("../../services/photoService");
const { uploadDslrPhotos } = require("../../services/dslrUploadService");

/**
 * GET /api/admin/photos
 */
async function listPhotos(req, res) {
  try {
    const params = {
      event_id:    parseInt(req.query.event_id, 10),
      searchName:  req.query.searchName,
      studentName: req.query.studentName,
      photoType:   req.query.photoType,
      page:        parseInt(req.query.page, 10) || 1,
      limit:       parseInt(req.query.limit, 10) || 20,
    };
    const result = await photoService.listPhotos(params);
    res.json(result);
  } catch (err) {
    console.error("List photos error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/events/:id/upload-dslr-photos
 */
async function uploadDslrPhotosController(req, res) {
  try {
    const eventId = parseInt(req.params.id, 10);
    const adminId = req.user.userId;
    const files   = req.files; // multer array of buffers

    // uploadDslrPhotos now returns { newCount, duplicateCount, details }
    const { newCount, duplicateCount, details } =
      await uploadDslrPhotos(eventId, files, adminId);

    res.status(201).json({ newCount, duplicateCount, details });
  } catch (err) {
    console.error("DSLR upload error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/photos/:photoId
 */
async function deletePhoto(req, res) {
  try {
    const photoId = parseInt(req.params.photoId, 10);
    await photoService.deletePhoto(photoId);
    res.status(204).end();
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  listPhotos,
  uploadDslrPhotosController,
  deletePhoto,
};
