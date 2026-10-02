import express from "express";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  broadcastNotification,
  sendDirectNotification,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isVolunteerOrAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/notifications
 * @desc    Get user's notification feed (with read & type filters, paginated)
 * @access  Protected
 */
router.get("/", protect, getMyNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count for the logged-in user
 * @access  Protected
 */
router.get("/unread-count", protect, getUnreadCount);

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all user's notifications as read
 * @access  Protected
 */
router.patch("/mark-all-read", protect, markAllNotificationsAsRead);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Protected
 */
router.patch("/:id/read", protect, markNotificationAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Soft-delete a notification
 * @access  Protected
 */
router.delete("/:id", protect, deleteNotification);

/**
 * @route   POST /api/notifications/broadcast
 * @desc    Broadcast a notification to students, volunteers, or a department
 * @access  Protected (Volunteer & Admin)
 */
router.post("/broadcast", protect, isVolunteerOrAdmin, broadcastNotification);

/**
 * @route   POST /api/notifications/send
 * @desc    Send a direct notification to a specific user
 * @access  Protected (Volunteer & Admin)
 */
router.post("/send", protect, isVolunteerOrAdmin, sendDirectNotification);

export default router;
