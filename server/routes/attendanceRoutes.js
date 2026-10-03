import express from "express";
import {
  scanQRAttendance,
  markManualAttendance,
  getMyAttendance,
  getEventAttendance,
  getAttendanceById,
  getAllAttendance,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * Attendance Routes
 */
// Student attendance view
router.get("/my", protect, authorizeRoles("student"), getMyAttendance);

// Volunteer & Admin scanning / manual marking
router.post("/scan", protect, authorizeRoles("volunteer", "admin"), scanQRAttendance);
router.post("/manual", protect, authorizeRoles("volunteer", "admin"), markManualAttendance);

// Event attendance & specific record views
router.get("/event/:eventId", protect, authorizeRoles("volunteer", "admin"), getEventAttendance);
router.get("/:id", protect, getAttendanceById);
router.get("/", protect, authorizeRoles("admin"), getAllAttendance);

export default router;
