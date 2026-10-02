import express from "express";
import {
  scanQRCode,
  markManualAttendance,
  getEventAttendanceSheet,
  getMyPresence,
  markVolunteerDutyAttendance,
  getVolunteerAttendanceRecords,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/attendance/scan
 * @desc    Scan student QR pass token and record attendance
 * @access  Volunteer & Admin Only
 */
router.post("/scan", protect, isVolunteerOrAdmin, scanQRCode);

/**
 * @route   POST /api/attendance/manual
 * @desc    Manually mark student attendance by Enrollment Number
 * @access  Volunteer & Admin Only
 */
router.post("/manual", protect, isVolunteerOrAdmin, markManualAttendance);

/**
 * @route   GET /api/attendance/event/:eventId
 * @desc    Get complete attendance sheet and statistics for an event
 * @access  Volunteer & Admin Only
 */
router.get("/event/:eventId", protect, isVolunteerOrAdmin, getEventAttendanceSheet);

/**
 * @route   GET /api/attendance/my-presence
 * @desc    Get attendance history across registered events for the logged-in student
 * @access  Protected (Student)
 */
router.get("/my-presence", protect, getMyPresence);

/**
 * @route   POST /api/attendance/volunteers
 * @desc    Record volunteer duty attendance
 * @access  Admin Only
 */
router.post("/volunteers", protect, isAdmin, markVolunteerDutyAttendance);

/**
 * @route   GET /api/attendance/volunteers
 * @desc    Get volunteer duty attendance records
 * @access  Volunteer & Admin Only
 */
router.get("/volunteers", protect, isVolunteerOrAdmin, getVolunteerAttendanceRecords);

export default router;
