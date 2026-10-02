import express from "express";
import {
  createEvent,
  getAllEvents,
  getUpcomingEvents,
  getOngoingEvents,
  getPastEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  reopenRegistration,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Optional auth helper: attaches user if token is present, but doesn't block if guest
const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return protect(req, res, next);
  }
  next();
};

/**
 * @route   GET /api/events/upcoming
 * @desc    Get upcoming events
 * @access  Public
 */
router.get("/upcoming", getUpcomingEvents);

/**
 * @route   GET /api/events/ongoing
 * @desc    Get ongoing events happening today
 * @access  Public
 */
router.get("/ongoing", getOngoingEvents);

/**
 * @route   GET /api/events/past
 * @desc    Get past / completed events
 * @access  Public
 */
router.get("/past", getPastEvents);

/**
 * @route   GET /api/events
 * @desc    Get all events with filters (status, category, search, pagination)
 * @access  Public (Staff sees drafts)
 */
router.get("/", optionalAuth, getAllEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get event details + seats remaining + user registration status
 * @access  Public (Protected enhancement if token provided)
 */
router.get("/:id", optionalAuth, getEventById);

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Admin & Volunteer Only
 */
router.post("/", protect, isVolunteerOrAdmin, createEvent);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event details
 * @access  Admin & Volunteer Only
 */
router.put("/:id", protect, isVolunteerOrAdmin, updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Soft-delete event
 * @access  Admin Only
 */
router.delete("/:id", protect, isAdmin, deleteEvent);

/**
 * @route   POST /api/events/:id/reopen
 * @desc    Reopen registration window with new deadline and optional capacity increase
 * @access  Admin & Volunteer Only
 */
router.post("/:id/reopen", protect, isVolunteerOrAdmin, reopenRegistration);

export default router;
