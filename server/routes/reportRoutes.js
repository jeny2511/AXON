import express from "express";
import {
  getReports,
  getReportById,
  uploadReport,
  updateReportStatus,
  deleteReport,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// GET all reports: volunteer, admin
router.get("/", protect, authorizeRoles("volunteer", "admin"), getReports);

// GET single report by ID: volunteer, admin
router.get("/:id", protect, authorizeRoles("volunteer", "admin"), getReportById);

// POST upload / submit report: volunteer, admin
router.post(
  "/",
  protect,
  authorizeRoles("volunteer", "admin"),
  upload.any(),
  uploadReport
);

// PUT update report review status: admin
router.put(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateReportStatus
);

// DELETE soft delete report: admin
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteReport
);

export default router;
