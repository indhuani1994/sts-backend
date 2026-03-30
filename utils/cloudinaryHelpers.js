// utils/cloudinaryHelpers.js
const cloudinary = require('./cloudinary');

/**
 * Extract Cloudinary public_id from full URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} public_id
 */
// const getPublicIdFromUrl = (url) => {
//   if (!url || typeof url !== 'string') return null;

//   try {
//     const parts = url.split('/');

//     // Find index of 'upload'
//     const uploadIndex = parts.findIndex(p => p === 'upload');

//     // Everything after 'upload' (skip version like v12345)
//     const publicIdParts = parts.slice(uploadIndex + 2);

//     // Join and remove extension
//     const fullPath = publicIdParts.join('/');
//     const publicId = fullPath.substring(0, fullPath.lastIndexOf('.'));

//     return publicId;
//   } catch (err) {
//     console.error('Public ID extraction failed:', err.message);
//     return null;
//   }
// };

const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  try {
    // ✅ Decode URL FIRST
    const decodedUrl = decodeURIComponent(url);

    const parts = decodedUrl.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');

    if (uploadIndex === -1) return null;

    let publicIdParts = parts.slice(uploadIndex + 1);

    // Remove version (v12345)
    if (publicIdParts[0].startsWith('v')) {
      publicIdParts = publicIdParts.slice(1);
    }

    const fullPath = publicIdParts.join('/');

    return fullPath.substring(0, fullPath.lastIndexOf('.'));
  } catch (err) {
    console.error('Public ID extraction failed:', err.message);
    return null;
  }
};

// const deleteCloudinaryByUrl = async (url, label = 'asset') => {
//   const publicId = getPublicIdFromUrl(url);
//   if (!publicId) {
//     console.log("No publicId found for:", url);
//     return;
//   }

//   try {
//     const isRaw = url.includes('/raw/');

//     const result = await cloudinary.uploader.destroy(publicId, {
//       resource_type: isRaw ? 'raw' : 'image',
//     });

//     console.log(`Deleted ${label}:`, publicId, result);
//   } catch (err) {
//     console.error(`Cloudinary deletion error for ${label}:`, err.message);
//   }
// };

const deleteCloudinaryByUrl = async (url, label = 'asset') => {
  if (!url || !url.startsWith('http')) {
    console.log("Invalid URL:", url);
    return;
  }

  const publicId = getPublicIdFromUrl(url);

  if (!publicId) {
    console.log("No publicId found for:", url);
    return;
  }

  try {
    const isRaw = url.includes('/raw/');

    console.log("Deleting Public ID:", publicId);

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: isRaw ? 'raw' : 'image',
    });

    console.log(`Deleted ${label}:`, result);

  } catch (err) {
    console.error(`Cloudinary deletion error:`, err.message);
  }
};

module.exports = { getPublicIdFromUrl, deleteCloudinaryByUrl };
