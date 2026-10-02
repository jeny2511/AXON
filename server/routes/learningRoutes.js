import express from "express";
import {
  getAllLearningResources,
  getFeaturedLearningResources,
  getLearningCategories,
  getLearningResourceById,
  createLearningResource,
  updateLearningResource,
  deleteLearningResource,
} from "../controllers/learningController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/learning
 * @desc    Get all learning resources with search & category filtering
 * @access  Public
 */
router.get("/", getAllLearningResources);

/**
 * @route   GET /api/learning/featured
 * @desc    Get featured articles and tutorials
 * @access  Public
 */
router.get("/featured", getFeaturedLearningResources);

/**
 * @route   GET /api/learning/categories
 * @desc    Get all available categories and resource counts
 * @access  Public
 */
router.get("/categories", getLearningCategories);

/**
 * @route   GET /api/learning/:id
 * @desc    Get single learning resource details
 * @access  Public
 */
router.get("/:id", getLearningResourceById);

/**
 * @route   POST /api/learning
 * @desc    Create a new cyber learning resource
 * @access  Protected (Volunteer & Admin)
 */
router.post("/", protect, isVolunteerOrAdmin, createLearningResource);

/**
 * @route   PUT /api/learning/:id
 * @desc    Update an existing learning resource
 * @access  Protected (Volunteer & Admin)
 */
router.put("/:id", protect, isVolunteerOrAdmin, updateLearningResource);

/**
 * @route   DELETE /api/learning/:id
 * @desc    Soft-delete a learning resource
 * @access  Protected (Admin Only)
 */
router.delete("/:id", protect, isAdmin, deleteLearningResource);

export default router;
