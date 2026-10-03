import express from "express";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from "../controllers/eventController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

/**
 * Event Routes
 */
// Asset upload (Poster, Rulebook, Photos)
router.post(
  "/upload",
  protect,
  authorizeRoles("admin", "volunteer"),
  upload.any(),
  (req, res) => {
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded." });
    }
    const fileUrl = `/uploads/${file.filename}`;
    return res.status(200).json({
      success: true,
      message: "File uploaded successfully.",
      url: fileUrl,
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }
);

// Public / Authenticated read access
router.get("/", protect, getEvents);
router.get("/:id", protect, getEventById);

// Admin / Volunteer Event Management
router.post("/", protect, authorizeRoles("admin", "volunteer"), createEvent);
router.put("/:id", protect, authorizeRoles("admin", "volunteer"), updateEvent);
router.delete("/:id", protect, authorizeRoles("admin", "volunteer"), deleteEvent);
router.patch("/:id/status", protect, authorizeRoles("admin", "volunteer"), updateEventStatus);

export default router;
