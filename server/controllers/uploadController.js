import { uploadBufferToCloudinary, deleteFromCloudinary } from "../utils/cloudinaryUploader.js";

/**
 * Upload Controller
 * Handles single and multi-file media uploads to Cloudinary for profiles,
 * events, gallery memories, learning hub materials, and reports.
 */

// =========================================================================
// 1. UPLOAD SINGLE FILE (Image or PDF)
// =========================================================================
export const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded. Please provide a file under the 'file' field.",
      });
    }

    const { folder = "axon/general" } = req.body;
    const isPdf = req.file.mimetype === "application/pdf";
    const resourceType = isPdf ? "raw" : "auto";

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `axon/${folder.replace(/^axon\/?/, "")}`,
      resourceType,
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to Cloudinary.",
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format || (isPdf ? "pdf" : "image"),
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("❌ [Upload Controller] uploadSingleFile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload file to Cloudinary.",
    });
  }
};

// =========================================================================
// 2. UPLOAD MULTIPLE FILES (e.g. Gallery photos)
// =========================================================================
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files were uploaded. Please provide files under the 'photos' or 'files' field.",
      });
    }

    const { folder = "axon/gallery" } = req.body;

    const uploadPromises = req.files.map((file) => {
      const isPdf = file.mimetype === "application/pdf";
      return uploadBufferToCloudinary(file.buffer, {
        folder: `axon/${folder.replace(/^axon\/?/, "")}`,
        resourceType: isPdf ? "raw" : "auto",
      });
    });

    const results = await Promise.all(uploadPromises);

    return res.status(200).json({
      success: true,
      message: `Successfully uploaded ${results.length} file(s) to Cloudinary.`,
      count: results.length,
      urls: results.map((r) => r.secure_url),
      files: results.map((r) => ({
        url: r.secure_url,
        publicId: r.public_id,
        format: r.format,
        bytes: r.bytes,
      })),
    });
  } catch (error) {
    console.error("❌ [Upload Controller] uploadMultipleFiles Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload files to Cloudinary.",
    });
  }
};

// =========================================================================
// 3. DELETE FILE FROM CLOUDINARY
// =========================================================================
export const deleteFile = async (req, res) => {
  try {
    const { publicId, resourceType = "image" } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required to delete file from Cloudinary.",
      });
    }

    const result = await deleteFromCloudinary(publicId, resourceType);

    return res.status(200).json({
      success: true,
      message: "File removed from Cloudinary.",
      result,
    });
  } catch (error) {
    console.error("❌ [Upload Controller] deleteFile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete file from Cloudinary.",
    });
  }
};

export default {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
};
