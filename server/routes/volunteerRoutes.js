import express from "express";
import {
  createVolunteer,
  getVolunteers,
  getVolunteerById,
  updateVolunteer,
  deleteVolunteer,
  getCommitteePositions,
  createCommitteePosition,
} from "../controllers/volunteerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/volunteer
 * @desc    Create a new volunteer account
 * @access  Admin Only
 */
router.post("/", protect, isAdmin, createVolunteer);

/**
 * @route   GET /api/volunteer
 * @desc    Get all active volunteers (filter by committee/department)
 * @access  Protected
 */
router.get("/", protect, getVolunteers);

/**
 * @route   GET /api/volunteer/positions
 * @desc    Get all active committee positions
 * @access  Protected
 */
router.get("/positions", protect, getCommitteePositions);

/**
 * @route   POST /api/volunteer/positions
 * @desc    Create a new committee position
 * @access  Admin Only
 */
router.post("/positions", protect, isAdmin, createCommitteePosition);

/**
 * @route   GET /api/volunteer/:id
 * @desc    Get single volunteer profile by ID
 * @access  Protected
 */
router.get("/:id", protect, getVolunteerById);

/**
 * @route   PUT /api/volunteer/:id
 * @desc    Update volunteer details (committee, designation, status)
 * @access  Admin Only
 */
router.put("/:id", protect, isAdmin, updateVolunteer);

/**
 * @route   DELETE /api/volunteer/:id
 * @desc    Soft-delete volunteer
 * @access  Admin Only
 */
router.delete("/:id", protect, isAdmin, deleteVolunteer);

export default router;
