import express from "express";
import {
  getGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
} from "../controllers/galleryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Asset upload (Gallery Photos)
router.post(
  "/upload",
  protect,
  authorizeRoles("volunteer", "admin"),
  upload.any(),
  (req, res) => {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No photo file uploaded." });
    }
    const fileUrl = `/uploads/${file.filename}`;
    return res.status(200).json({
      success: true,
      message: "Photo uploaded successfully.",
      url: fileUrl,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }
);

// GET all gallery items: student, volunteer, admin
router.get("/", protect, getGalleryItems);

// GET single gallery item: student, volunteer, admin
router.get("/:id", protect, getGalleryItemById);

// POST create gallery item: volunteer, admin
router.post("/", protect, authorizeRoles("volunteer", "admin"), createGalleryItem);

// PUT update gallery item: volunteer, admin
router.put("/:id", protect, authorizeRoles("volunteer", "admin"), updateGalleryItem);

// DELETE soft-delete gallery item: volunteer, admin
router.delete("/:id", protect, authorizeRoles("volunteer", "admin"), deleteGalleryItem);

export default router;
