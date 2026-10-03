import express from "express";
import {
  getVolunteerTasks,
  getVolunteerTaskById,
  createVolunteerTask,
  updateVolunteerTask,
  deleteVolunteerTask,
  getVolunteerInvolvements,
  createVolunteerInvolvement,
  deleteVolunteerInvolvement,
  getVolunteerAttendance,
  markVolunteerAttendance,
  deleteVolunteerAttendance,
  getVolunteerDashboardStats,
} from "../controllers/volunteerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// ==========================================
// VOLUNTEER TASKS
// ==========================================
router.get("/tasks", protect, authorizeRoles("volunteer", "admin"), getVolunteerTasks);
router.get("/tasks/:id", protect, authorizeRoles("volunteer", "admin"), getVolunteerTaskById);
router.post("/tasks", protect, authorizeRoles("admin"), createVolunteerTask);
router.put("/tasks/:id", protect, authorizeRoles("volunteer", "admin"), updateVolunteerTask);
router.delete("/tasks/:id", protect, authorizeRoles("admin"), deleteVolunteerTask);

// ==========================================
// VOLUNTEER ATTENDANCE (STAFF/ADMIN MARKED)
// ==========================================
router.get("/attendance", protect, authorizeRoles("volunteer", "admin"), getVolunteerAttendance);
router.post("/attendance", protect, authorizeRoles("admin"), markVolunteerAttendance);
router.delete("/attendance/:id", protect, authorizeRoles("admin"), deleteVolunteerAttendance);

// ==========================================
// VOLUNTEER INVOLVEMENT
// ==========================================
router.get("/involvements", protect, authorizeRoles("volunteer", "admin"), getVolunteerInvolvements);
router.post("/involvements", protect, authorizeRoles("admin"), createVolunteerInvolvement);
router.delete("/involvements/:id", protect, authorizeRoles("admin"), deleteVolunteerInvolvement);

// ==========================================
// DASHBOARD & STATS
// ==========================================
router.get("/dashboard-stats", protect, authorizeRoles("volunteer", "admin"), getVolunteerDashboardStats);

export default router;
