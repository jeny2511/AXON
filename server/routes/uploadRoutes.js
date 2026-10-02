import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  deleteFile,
} from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/upload/single
 * @desc    Upload a single image or PDF file to Cloudinary (avatar, event poster, report)
 * @access  Protected
 */
router.post("/single", protect, upload.single("file"), uploadSingleFile);

/**
 * @route   POST /api/upload/multiple
 * @desc    Upload up to 20 files simultaneously to Cloudinary (gallery albums)
 * @access  Protected (Volunteer & Admin)
 */
router.post(
  "/multiple",
  protect,
  isVolunteerOrAdmin,
  upload.array("photos", 20),
  uploadMultipleFiles
);

/**
 * @route   POST /api/upload/delete
 * @desc    Delete an asset from Cloudinary
 * @access  Protected (Volunteer & Admin)
 */
router.post("/delete", protect, isVolunteerOrAdmin, deleteFile);

export default router;
