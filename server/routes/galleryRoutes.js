import express from "express";
import {
  getAllGalleryAlbums,
  getGalleryAlbumById,
  createGalleryAlbum,
  updateGalleryAlbum,
  addPhotosToAlbum,
  deleteGalleryAlbum,
} from "../controllers/galleryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/gallery
 * @desc    Get all active gallery albums (Public)
 * @access  Public
 */
router.get("/", getAllGalleryAlbums);

/**
 * @route   GET /api/gallery/:id
 * @desc    Get single gallery album details and photos
 * @access  Public
 */
router.get("/:id", getGalleryAlbumById);

/**
 * @route   POST /api/gallery
 * @desc    Create a new gallery album
 * @access  Protected (Volunteer & Admin)
 */
router.post("/", protect, isVolunteerOrAdmin, createGalleryAlbum);

/**
 * @route   PUT /api/gallery/:id
 * @desc    Update gallery album metadata/photos
 * @access  Protected (Volunteer & Admin)
 */
router.put("/:id", protect, isVolunteerOrAdmin, updateGalleryAlbum);

/**
 * @route   POST /api/gallery/:id/photos
 * @desc    Add photo URLs to an existing gallery album
 * @access  Protected (Volunteer & Admin)
 */
router.post("/:id/photos", protect, isVolunteerOrAdmin, addPhotosToAlbum);

/**
 * @route   DELETE /api/gallery/:id
 * @desc    Soft-delete a gallery album
 * @access  Protected (Volunteer & Admin)
 */
router.delete("/:id", protect, isVolunteerOrAdmin, deleteGalleryAlbum);

export default router;

