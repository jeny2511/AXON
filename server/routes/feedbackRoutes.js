import express from "express";
import {
  submitFeedback,
  getMyFeedback,
  getEventFeedback,
  getFeedbackById,
} from "../controllers/feedbackController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Feedback Routes
 */
// Student submission & my feedback
router.post("/", protect, authorizeRoles("student"), submitFeedback);
router.get("/my", protect, authorizeRoles("student"), getMyFeedback);

// Event feedback overview (Volunteer & Admin)
router.get("/event/:eventId", protect, authorizeRoles("volunteer", "admin"), getEventFeedback);

// Specific feedback lookup
router.get("/:id", protect, getFeedbackById);

export default router;
