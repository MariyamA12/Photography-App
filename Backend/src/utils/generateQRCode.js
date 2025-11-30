const QRCode = require('qrcode');

/**
 * Generate a QR code image buffer for given text.
 * @param {string} text - Content to encode
 * @param {object} [options] - QR options
 * @returns {Promise<Buffer>}
 */
async function generateQRCodeImage(text, options = { errorCorrectionLevel: 'H', type: 'png', margin: 1, width: 300 }) {
  return QRCode.toBuffer(text, options);
}

module.exports = { generateQRCodeImage };