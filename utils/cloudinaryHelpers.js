// utils/cloudinaryHelpers.js
const cloudinary = require('./cloudinary');

/**
 * Extract Cloudinary public_id from full URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} public_id
 */
const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  if (!/^https?:\/\//i.test(url)) return null;

  // Split URL into parts
  const parts = url.split('/');

  // Last part is filename with extension
  const filename = parts.slice(-1)[0];

  // Second to last part is folder
  const folder = parts.slice(-2, -1)[0];

  // Combine folder + filename (without extension) -> public_id
  const publicId = `${folder}/${filename.split('.').slice(0, -1).join('.')}`;

  return publicId;
};

const deleteCloudinaryByUrl = async (url, label = 'asset') => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;

  try {
    const extension = String(url).split('?')[0].split('.').pop().toLowerCase();
    const isRaw = ['pdf', 'doc', 'docx'].includes(extension);
    await cloudinary.uploader.destroy(publicId, { resource_type: isRaw ? 'raw' : 'image' });
  } catch (err) {
    console.error(`Cloudinary deletion error for ${label}:`, err.message);
  }
};

module.exports = { getPublicIdFromUrl, deleteCloudinaryByUrl };
