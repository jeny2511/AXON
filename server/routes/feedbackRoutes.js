import express from "express";
import {
  getFeedbackForm,
  createOrUpdateFeedbackForm,
  submitFeedback,
  getEventFeedbackAnalytics,
  getMyFeedback,
} from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/feedback/form/:eventId
 * @desc    Get the feedback questions/form for an event (checks student attendance & submission status)
 * @access  Protected
 */
router.get("/form/:eventId", protect, getFeedbackForm);

/**
 * @route   POST /api/feedback/form/:eventId
 * @desc    Configure or update custom feedback form questions for an event
 * @access  Volunteer & Admin Only
 */
router.post("/form/:eventId", protect, isVolunteerOrAdmin, createOrUpdateFeedbackForm);

/**
 * @route   POST /api/feedback/submit/:eventId
 * @desc    Submit student feedback (Enforces strict attendance check & unlocks certificate)
 * @access  Protected (Student)
 */
router.post("/submit/:eventId", protect, submitFeedback);

/**
 * @route   GET /api/feedback/event/:eventId/analytics
 * @desc    Get aggregated feedback ratings, recommendation score, distribution, and comments
 * @access  Volunteer & Admin Only
 */
router.get("/event/:eventId/analytics", protect, isVolunteerOrAdmin, getEventFeedbackAnalytics);

/**
 * @route   GET /api/feedback/my-feedback
 * @desc    Get all feedback submitted by the logged-in student
 * @access  Protected (Student)
 */
router.get("/my-feedback", protect, getMyFeedback);

export default router;
