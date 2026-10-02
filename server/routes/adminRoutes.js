import express from "express";
import {
  getAdminDashboardStats,
  getAuditLogs,
  uploadEventReport,
  getAllReports,
  getReportById,
  reviewEventReport,
  getGlobalSettings,
  updateGlobalSettings,
  getAboutTCF,
  updateAboutTCF,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin, isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get system-wide analytics, counts, department participation, and recent activities
 * @access  Protected (Admin Only)
 */
router.get("/dashboard", protect, isAdmin, getAdminDashboardStats);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get paginated audit logs
 * @access  Protected (Admin Only)
 */
router.get("/audit-logs", protect, isAdmin, getAuditLogs);

/**
 * @route   POST /api/admin/reports
 * @desc    Upload or resubmit an event report PDF (One report per event)
 * @access  Protected (Volunteer & Admin)
 */
router.post("/reports", protect, isVolunteerOrAdmin, uploadEventReport);

/**
 * @route   GET /api/admin/reports
 * @desc    Get all submitted event reports (filtered by status or event)
 * @access  Protected (Volunteer & Admin)
 */
router.get("/reports", protect, isVolunteerOrAdmin, getAllReports);

/**
 * @route   GET /api/admin/reports/:id
 * @desc    Get detailed event report by ID including revision history
 * @access  Protected (Volunteer & Admin)
 */
router.get("/reports/:id", protect, isVolunteerOrAdmin, getReportById);

/**
 * @route   PATCH /api/admin/reports/:id/review
 * @desc    Review and approve/reject an event report
 * @access  Protected (Admin Only)
 */
router.patch("/reports/:id/review", protect, isAdmin, reviewEventReport);

/**
 * @route   GET /api/admin/settings
 * @desc    Get global configuration settings
 * @access  Protected (Admin Only)
 */
router.get("/settings", protect, isAdmin, getGlobalSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Update global configuration settings
 * @access  Protected (Admin Only)
 */
router.put("/settings", protect, isAdmin, updateGlobalSettings);

/**
 * @route   GET /api/admin/about
 * @desc    Get About TCF information, mission, vision, and team members
 * @access  Public
 */
router.get("/about", getAboutTCF);

/**
 * @route   PUT /api/admin/about
 * @desc    Update About TCF details and team members
 * @access  Protected (Admin Only)
 */
router.put("/about", protect, isAdmin, updateAboutTCF);

export default router;
