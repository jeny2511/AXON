import cloudinary from "../config/cloudinary.js";

/**
 * Cloudinary Upload Helper
 * Streams buffer in memory to Cloudinary without creating disk temp files.
 *
 * @param {Buffer} fileBuffer - Buffer from multer (req.file.buffer)
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadBufferToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "axon",
        resource_type: options.resourceType || "auto",
        ...options,
      },
      (error, result) => {
        if (error) {
          console.error("❌ [Cloudinary Stream Error]:", error);
          return reject(error);
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a media asset from Cloudinary by its public ID
 *
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - "image" | "raw" | "video"
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error("❌ [Cloudinary Delete Error]:", error);
    throw error;
  }
};

export default {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
};
