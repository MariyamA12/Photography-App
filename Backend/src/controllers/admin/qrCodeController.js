// src/controllers/admin/qrCodeController.js
const qrCodeService = require('../../services/qrCodeService');

async function generateQrCodesForEvent(req, res) {
  const eventId = parseInt(req.params.eventId, 10);
  try {
    await qrCodeService.generateQRCodes(eventId);
    res.status(201).json({ message: 'QR codes generated successfully' });
  } catch (err) {
    console.error('Generate QR codes error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getEventQRCodes(req, res) {
  const eventId = parseInt(req.params.eventId, 10);
  const { studentName, photoType, isScanned, page = 1, limit = 20 } = req.query;
  try {
    const result = await qrCodeService.getQRCodesByEvent(eventId, {
      studentName,
      photoType,
      isScanned: isScanned === 'true' ? true : isScanned === 'false' ? false : undefined,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });
    res.json(result);
  } catch (err) {
    console.error('Get QR codes error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function downloadEventQRCodes(req, res) {
  const eventId = parseInt(req.params.eventId, 10);
  try {
    await qrCodeService.downloadAllQRCodesAsZip(eventId, res);
  } catch (err) {
    console.error('Download QR codes error:', err);
    res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  generateQrCodesForEvent,
  getEventQRCodes,
  downloadEventQRCodes,
};
