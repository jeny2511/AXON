import express from "express";
import {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventRegistrations,
  getAllRegistrations,
} from "../controllers/registrationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Registration Routes
 */
// Student registration & student history
router.post("/", protect, authorizeRoles("student"), registerForEvent);
router.get("/my", protect, authorizeRoles("student"), getMyRegistrations);
router.delete("/:id", protect, cancelRegistration);
router.patch("/:id/cancel", protect, cancelRegistration);

// Volunteer & Admin participant views
router.get("/event/:eventId", protect, authorizeRoles("volunteer", "admin"), getEventRegistrations);
router.get("/", protect, authorizeRoles("volunteer", "admin"), getAllRegistrations);

export default router;
