import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Notification Controller
 * Handles user notification feed, unread count tracking, read status updates,
 * and Admin/Volunteer broadcast & direct notification dispatching.
 */

// =========================================================================
// 1. GET MY NOTIFICATIONS (Protected)
// =========================================================================
export const getMyNotifications = async (req, res) => {
  try {
    const { read, type, page = 1, limit = 20 } = req.query;

    const query = {
      recipientId: req.user._id,
      isDeleted: false,
    };

    if (read !== undefined) {
      query.read = read === "true" || read === true;
    }

    if (type && type.trim()) {
      query.type = type.trim();
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalNotifications = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const unreadCount = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      totalNotifications,
      totalPages: Math.ceil(totalNotifications / limitNum),
      currentPage: pageNum,
      unreadCount,
      notifications: notifications.map((n) => n.toObject({ virtuals: true })),
    });
  } catch (error) {
    console.error("❌ [Notification Controller] getMyNotifications Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve notifications.",
    });
  }
};

// =========================================================================
// 2. GET UNREAD NOTIFICATIONS COUNT (Protected)
// =========================================================================
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user._id,
      read: false,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("❌ [Notification Controller] getUnreadCount Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to count unread notifications.",
    });
  }
};

// =========================================================================
// 3. MARK SINGLE NOTIFICATION AS READ (Protected)
// =========================================================
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      recipientId: req.user._id,
      isDeleted: false,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      notification: notification.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Notification Controller] markNotificationAsRead Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update notification.",
    });
  }
};

// =========================================================================
// 4. MARK ALL NOTIFICATIONS AS READ (Protected)
// =========================================================================
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        recipientId: req.user._id,
        read: false,
        isDeleted: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} notification(s) as read.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ [Notification Controller] markAllNotificationsAsRead Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark notifications as read.",
    });
  }
};

// =========================================================================
// 5. DELETE NOTIFICATION (Soft Delete - Protected)
// =========================================================================
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const query = { _id: id, isDeleted: false };
    // Only recipient or admin can delete
    if (req.user.role !== "admin") {
      query.recipientId = req.user._id;
    }

    const notification = await Notification.findOne(query);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    notification.isDeleted = true;
    notification.deletedAt = new Date();
    notification.deletedBy = req.user._id;
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    console.error("❌ [Notification Controller] deleteNotification Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete notification.",
    });
  }
};

// =========================================================================
// 6. BROADCAST NOTIFICATION (Volunteer & Admin)
// =========================================================================
export const broadcastNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type = "general",
      targetAudience = "all", // "all", "students", "volunteers", "department"
      department,
      relatedEntityType = "none",
      relatedEntityId = null,
      channels = ["website"],
    } = req.body;

    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Both title and message are required for broadcasting.",
      });
    }

    // Determine target users
    const userQuery = { isDeleted: false };

    if (targetAudience === "students") {
      userQuery.role = "student";
    } else if (targetAudience === "volunteers") {
      userQuery.role = "volunteer";
    } else if (targetAudience === "department" && department) {
      userQuery.department = department.trim().toUpperCase();
    }

    const users = await User.find(userQuery).select("_id email");

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No recipients found matching the target audience criteria.",
      });
    }

    const notificationDocs = users.map((u) => ({
      recipientId: u._id,
      title: title.trim(),
      message: message.trim(),
      type,
      relatedEntityType,
      relatedEntityId,
      channels: Array.isArray(channels) ? channels : ["website"],
      read: false,
    }));

    await Notification.insertMany(notificationDocs);

    return res.status(201).json({
      success: true,
      message: `Notification broadcasted successfully to ${users.length} user(s).`,
      recipientCount: users.length,
    });
  } catch (error) {
    console.error("❌ [Notification Controller] broadcastNotification Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to broadcast notification.",
    });
  }
};

// =========================================================================
// 7. SEND DIRECT NOTIFICATION (Volunteer & Admin)
// =========================================================================
export const sendDirectNotification = async (req, res) => {
  try {
    const {
      recipientId,
      title,
      message,
      type = "general",
      relatedEntityType = "none",
      relatedEntityId = null,
      channels = ["website"],
    } = req.body;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required.",
      });
    }

    if (!title || !title.trim() || !message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required.",
      });
    }

    const recipient = await User.findOne({ _id: recipientId, isDeleted: false });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient user not found.",
      });
    }

    const newNotification = await Notification.create({
      recipientId: recipient._id,
      title: title.trim(),
      message: message.trim(),
      type,
      relatedEntityType,
      relatedEntityId,
      channels: Array.isArray(channels) ? channels : ["website"],
      read: false,
    });

    return res.status(201).json({
      success: true,
      message: `Notification sent to ${recipient.fullName}.`,
      notification: newNotification.toObject({ virtuals: true }),
    });
  } catch (error) {
    console.error("❌ [Notification Controller] sendDirectNotification Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send notification.",
    });
  }
};

export default {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  broadcastNotification,
  sendDirectNotification,
};
