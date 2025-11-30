// src/controllers/photographer/qrCodeController.js

const { getQRCodesByEvent } = require('../../services/qrCodeService');

/**
 * GET /api/photographer/events/:id/qrcodes
 */
exports.listQRCodes = async (req, res) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    const {
      photoType,
      isScanned,
      studentName,
      page  = '1',
      limit = '20',
    } = req.query;

    // convert isScanned from string to boolean if present
    const scannedFlag =
      isScanned === undefined
        ? undefined
        : isScanned === 'true';

    const result = await getQRCodesByEvent(eventId, {
      photoType,
      isScanned:   scannedFlag,
      studentName,
      page:        parseInt(page, 10),
      limit:       parseInt(limit, 10),
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('List QR codes error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
