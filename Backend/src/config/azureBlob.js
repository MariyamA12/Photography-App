// src/config/azureBlob.js
const {
  StorageSharedKeyCredential,
  BlobServiceClient,
} = require("@azure/storage-blob");

// 1) Raw env vars
const rawName           = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const rawKey            = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const rawQrContainer    = process.env.AZURE_QR_CONTAINER_NAME;
const rawPhotoContainer = process.env.AZURE_PHOTO_CONTAINER_NAME;

// 2) Trim & validate
const accountName    = rawName?.trim();
const accountKey     = rawKey?.trim();
const qrContainer    = rawQrContainer?.trim();
const photoContainer = rawPhotoContainer?.trim();

if (!accountName)    throw new Error("AZURE_STORAGE_ACCOUNT_NAME missing");
if (!accountKey)     throw new Error("AZURE_STORAGE_ACCOUNT_KEY missing");
if (!qrContainer)    throw new Error("AZURE_QR_CONTAINER_NAME missing");
if (!photoContainer) throw new Error("AZURE_PHOTO_CONTAINER_NAME missing");

// 3) Build clients
const credential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);

const qrContainerClient    = blobServiceClient.getContainerClient(qrContainer);
const photoContainerClient = blobServiceClient.getContainerClient(photoContainer);

/**
 * Upload a buffer to the QR-code container.
 */
async function uploadToQrContainer(buffer, blobName, mimeType = "image/png") {
  const client = qrContainerClient.getBlockBlobClient(blobName);
  await client.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });
  return client.url;
}

/**
 * Alias for backwards-compatibility with qrCodeService
 */
const uploadBufferToBlob = uploadToQrContainer;

/**
 * Upload a buffer to the photos container.
 */
async function uploadToPhotoContainer(buffer, blobName, mimeType = "image/png") {
  const client = photoContainerClient.getBlockBlobClient(blobName);
  await client.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });
  return client.url;
}

/**
 * Download a blob from the QR-code container into a Buffer.
 */
async function downloadBlobToBuffer(blobName) {
  const client = qrContainerClient.getBlockBlobClient(blobName);
  return await client.downloadToBuffer();
}

module.exports = {
  uploadToQrContainer,
  uploadBufferToBlob,
  uploadToPhotoContainer,
  downloadBlobToBuffer,
};
