import express from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  getVolunteers,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * User Profile & Management Endpoints
 */
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.get("/volunteers", protect, authorizeRoles("volunteer", "admin"), getVolunteers);

export default router;

