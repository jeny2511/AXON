import multer from "multer";

/**
 * File Upload Middleware using Multer memory storage
 * Handles multipart/form-data for Cloudinary uploads
 */
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
});

export default upload;
