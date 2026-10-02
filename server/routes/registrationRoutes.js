import express from "express";
import {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  getRegistrationById,
} from "../controllers/registrationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/registrations/:eventId
 * @desc    Register authenticated student for an event (Generates QR Pass)
 * @access  Protected (Student)
 */
router.post("/:eventId", protect, registerForEvent);

/**
 * @route   POST /api/registrations/event/:eventId
 * @desc    Alias for registering student for an event
 * @access  Protected (Student)
 */
router.post("/event/:eventId", protect, registerForEvent);

/**
 * @route   GET /api/registrations/my-events
 * @desc    Get all events registered by current student
 * @access  Protected (Student)
 */
router.get("/my-events", protect, getMyRegistrations);

/**
 * @route   GET /api/registrations/event/:eventId/participants
 * @desc    Get all participants registered for an event
 * @access  Protected (Admin & Volunteer Only)
 */
router.get(
  "/event/:eventId/participants",
  protect,
  isVolunteerOrAdmin,
  getEventParticipants
);

/**
 * @route   GET /api/registrations/:id
 * @desc    Get single registration details with QR pass token
 * @access  Protected
 */
router.get("/:id", protect, getRegistrationById);

/**
 * @route   DELETE /api/registrations/:id
 * @desc    Cancel an event registration
 * @access  Protected (Student or Admin)
 */
router.delete("/:id", protect, cancelRegistration);

export default router;
