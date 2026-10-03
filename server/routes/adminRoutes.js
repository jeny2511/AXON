import express from "express";
import {
  getAdminDashboardStats,
  getUsers,
  getUserById,
  createVolunteerUser,
  updateUserStatus,
  deleteUser,
  getSystemAnalysis,
  getAboutTCF,
  updateAboutTCF,
  getGlobalSettings,
  updateGlobalSettings,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Public / Authenticated
router.get("/about", getAboutTCF);

// Protected Admin Routes
router.get("/dashboard-stats", protect, authorizeRoles("admin"), getAdminDashboardStats);
router.get("/users", protect, authorizeRoles("admin"), getUsers);
router.get("/users/:id", protect, authorizeRoles("admin"), getUserById);
router.post("/volunteers", protect, authorizeRoles("admin"), createVolunteerUser);
router.put("/users/:id/status", protect, authorizeRoles("admin"), updateUserStatus);
router.delete("/users/:id", protect, authorizeRoles("admin"), deleteUser);
router.get("/analysis", protect, authorizeRoles("admin"), getSystemAnalysis);
router.put("/about", protect, authorizeRoles("admin"), updateAboutTCF);
router.get("/settings", protect, authorizeRoles("admin"), getGlobalSettings);
router.put("/settings", protect, authorizeRoles("admin"), updateGlobalSettings);

export default router;
