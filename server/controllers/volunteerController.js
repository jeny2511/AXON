import mongoose from "mongoose";
import VolunteerTask from "../models/VolunteerTask.js";
import VolunteerAttendance from "../models/VolunteerAttendance.js";
import VolunteerInvolvement from "../models/VolunteerInvolvement.js";
import Registration from "../models/Registration.js";
import Attendance from "../models/Attendance.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

// =========================================================================
// PART A: VOLUNTEER TASKS
// =========================================================================

/**
 * Get Volunteer Tasks
 * GET /api/volunteer/tasks
 * Access: Protected | Allowed: volunteer (own tasks or event), admin (all)
 */
export const getVolunteerTasks = async (req, res) => {
  try {
    const { eventId, volunteerId, status, completed } = req.query;

    const query = { isDeleted: false };

    if (req.user.role === "volunteer") {
      // Volunteers can view their own assigned tasks or all tasks for a specific event
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = eventId;
      } else {
        query.assignedTo = req.user._id;
      }
    } else if (req.user.role === "admin") {
      if (volunteerId && mongoose.Types.ObjectId.isValid(volunteerId)) {
        query.assignedTo = volunteerId;
      }
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = eventId;
      }
    }

    if (status && ["pending", "in-progress", "completed"].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    if (completed !== undefined) {
      query.completed = completed === "true" || completed === true;
    }

    const tasks = await VolunteerTask.find(query)
      .populate("assignedTo", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role")
      .populate("completedBy", "name fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteer tasks.",
    });
  }
};

/**
 * Get Specific Volunteer Task by ID
 * GET /api/volunteer/tasks/:id
 * Access: Protected | Allowed: volunteer (own only), admin
 */
export const getVolunteerTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid task ID is required.",
      });
    }

    const task = await VolunteerTask.findOne({ _id: id, isDeleted: false })
      .populate("assignedTo", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role")
      .populate("completedBy", "name fullName role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Volunteer task not found.",
      });
    }

    // RBAC: Volunteer can view only task assigned to them
    if (
      req.user.role === "volunteer" &&
      task.assignedTo &&
      String(task.assignedTo._id || task.assignedTo) !== String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view another volunteer's task.",
      });
    }

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteer task.",
    });
  }
};

/**
 * Create Volunteer Task
 * POST /api/volunteer/tasks
 * Access: Protected | Allowed: admin
 */
export const createVolunteerTask = async (req, res) => {
  try {
    const {
      eventId,
      title,
      taskName,
      description,
      assignedTo,
      volunteerId,
      priority,
      dueDate,
    } = req.body;

    const taskTitle = (title || taskName || "").trim();
    if (!taskTitle) {
      return res.status(400).json({
        success: false,
        message: "Task title is required.",
      });
    }

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Referenced event does not exist or has been deleted.",
      });
    }

    let targetVolunteerId = null;
    const rawVolunteerId = assignedTo || volunteerId;
    if (rawVolunteerId) {
      if (!mongoose.Types.ObjectId.isValid(rawVolunteerId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid volunteer ID provided.",
        });
      }

      const volunteer = await User.findOne({
        _id: rawVolunteerId,
        isDeleted: false,
        accountStatus: "active",
      });

      if (!volunteer) {
        return res.status(404).json({
          success: false,
          message: "Assigned volunteer does not exist or is inactive.",
        });
      }

      if (volunteer.role !== "volunteer") {
        return res.status(400).json({
          success: false,
          message: "Task can only be assigned to a user with volunteer role.",
        });
      }

      targetVolunteerId = volunteer._id;
    }

    const rawPriority = (priority || "medium").toString().toLowerCase().trim();
    const normPriority = ["low", "medium", "high"].includes(rawPriority) ? rawPriority : "medium";

    const newTask = await VolunteerTask.create({
      eventId: event._id,
      title: taskTitle,
      description: description || "",
      assignedTo: targetVolunteerId,
      assignedBy: req.user._id,
      priority: normPriority,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "pending",
      completed: false,
    });

    const populated = await VolunteerTask.findById(newTask._id)
      .populate("assignedTo", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role");

    return res.status(201).json({
      success: true,
      message: "Volunteer task created successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create volunteer task.",
    });
  }
};

/**
 * Update Volunteer Task
 * PUT /api/volunteer/tasks/:id
 * Access: Protected | Allowed: volunteer (own task progress), admin (all fields)
 */
export const updateVolunteerTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid task ID is required.",
      });
    }

    const task = await VolunteerTask.findOne({ _id: id, isDeleted: false });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Volunteer task not found.",
      });
    }

    // Role check
    if (req.user.role === "volunteer") {
      // Volunteer can update ONLY their own assigned task
      if (!task.assignedTo || String(task.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update another volunteer's task.",
        });
      }

      // Volunteer can only update status or completion
      const { status, completed } = req.body;
      if (status !== undefined) {
        const normStatus = status.toLowerCase().trim();
        if (!["pending", "in-progress", "completed"].includes(normStatus)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status. Allowed: pending, in-progress, completed",
          });
        }
        task.status = normStatus;
        if (normStatus === "completed") {
          task.completed = true;
          task.completedAt = new Date();
          task.completedBy = req.user._id;
        } else {
          task.completed = false;
          task.completedAt = null;
          task.completedBy = null;
        }
      }

      if (completed !== undefined) {
        task.completed = Boolean(completed);
        if (task.completed) {
          task.status = "completed";
          task.completedAt = new Date();
          task.completedBy = req.user._id;
        } else {
          if (task.status === "completed") task.status = "in-progress";
          task.completedAt = null;
          task.completedBy = null;
        }
      }
    } else if (req.user.role === "admin") {
      const {
        title,
        taskName,
        description,
        assignedTo,
        volunteerId,
        status,
        completed,
        priority,
        dueDate,
      } = req.body;

      if (title !== undefined || taskName !== undefined) {
        const t = (title || taskName || "").trim();
        if (!t) {
          return res.status(400).json({
            success: false,
            message: "Task title cannot be empty.",
          });
        }
        task.title = t;
      }

      if (description !== undefined) task.description = description;
      if (priority !== undefined) {
        const rawPriority = priority.toString().toLowerCase().trim();
        task.priority = ["low", "medium", "high"].includes(rawPriority) ? rawPriority : "medium";
      }
      if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

      const rawVolunteerId = assignedTo !== undefined ? assignedTo : volunteerId;
      if (rawVolunteerId !== undefined) {
        if (rawVolunteerId === null || rawVolunteerId === "") {
          task.assignedTo = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(rawVolunteerId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid volunteer ID provided.",
            });
          }
          const volunteer = await User.findOne({
            _id: rawVolunteerId,
            isDeleted: false,
            accountStatus: "active",
          });
          if (!volunteer || volunteer.role !== "volunteer") {
            return res.status(400).json({
              success: false,
              message: "Assigned user must be an active volunteer.",
            });
          }
          task.assignedTo = volunteer._id;
        }
      }

      if (status !== undefined) {
        const normStatus = status.toLowerCase().trim();
        if (!["pending", "in-progress", "completed"].includes(normStatus)) {
          return res.status(400).json({
            success: false,
            message: "Invalid status. Allowed: pending, in-progress, completed",
          });
        }
        task.status = normStatus;
        if (normStatus === "completed") {
          task.completed = true;
          task.completedAt = new Date();
          task.completedBy = req.user._id;
        } else {
          task.completed = false;
          task.completedAt = null;
          task.completedBy = null;
        }
      }

      if (completed !== undefined) {
        task.completed = Boolean(completed);
        if (task.completed) {
          task.status = "completed";
          task.completedAt = new Date();
          task.completedBy = req.user._id;
        } else {
          if (task.status === "completed") task.status = "in-progress";
          task.completedAt = null;
          task.completedBy = null;
        }
      }
    }

    await task.save();

    const populated = await VolunteerTask.findById(task._id)
      .populate("assignedTo", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role")
      .populate("completedBy", "name fullName role");

    return res.status(200).json({
      success: true,
      message: "Volunteer task updated successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update volunteer task.",
    });
  }
};

/**
 * Soft Delete Volunteer Task
 * DELETE /api/volunteer/tasks/:id
 * Access: Protected | Allowed: admin
 */
export const deleteVolunteerTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid task ID is required.",
      });
    }

    const task = await VolunteerTask.findOne({ _id: id, isDeleted: false });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Volunteer task not found.",
      });
    }

    task.isDeleted = true;
    task.deletedAt = new Date();
    task.deletedBy = req.user._id;
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Volunteer task deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete volunteer task.",
    });
  }
};

// =========================================================================
// PART B: VOLUNTEER INVOLVEMENT
// =========================================================================

/**
 * Get Volunteer Involvements
 * GET /api/volunteer/involvements
 * Access: Protected | Allowed: volunteer (own), admin (all)
 */
export const getVolunteerInvolvements = async (req, res) => {
  try {
    const { volunteerId, eventId } = req.query;

    const query = {};

    if (req.user.role === "volunteer") {
      query.volunteerId = req.user._id;
    } else if (req.user.role === "admin") {
      if (volunteerId && mongoose.Types.ObjectId.isValid(volunteerId)) {
        query.volunteerId = volunteerId;
      }
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = eventId;
      }
    }

    const involvements = await VolunteerInvolvement.find(query)
      .populate("volunteerId", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: involvements.length,
      data: involvements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteer involvements.",
    });
  }
};

/**
 * Create/Assign Volunteer Involvement
 * POST /api/volunteer/involvements
 * Access: Protected | Allowed: admin
 */
export const createVolunteerInvolvement = async (req, res) => {
  try {
    const { volunteerId, eventId, responsibility, roleStatus } = req.body;

    if (!volunteerId || !mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({
        success: false,
        message: "A valid volunteer ID is required.",
      });
    }

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    if (!responsibility || !responsibility.trim()) {
      return res.status(400).json({
        success: false,
        message: "Volunteer responsibility is required.",
      });
    }

    const volunteer = await User.findOne({
      _id: volunteerId,
      isDeleted: false,
      accountStatus: "active",
    });

    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(400).json({
        success: false,
        message: "User is not an active volunteer.",
      });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or has been deleted.",
      });
    }

    // Upsert or check existing
    let involvement = await VolunteerInvolvement.findOne({
      volunteerId,
      eventId,
    });

    if (involvement) {
      involvement.responsibility = responsibility.trim();
      if (roleStatus) involvement.roleStatus = roleStatus;
      involvement.assignedBy = req.user._id;
      await involvement.save();
    } else {
      involvement = await VolunteerInvolvement.create({
        volunteerId,
        eventId,
        responsibility: responsibility.trim(),
        roleStatus: roleStatus || "assigned",
        assignedBy: req.user._id,
      });
    }

    const populated = await VolunteerInvolvement.findById(involvement._id)
      .populate("volunteerId", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("assignedBy", "name fullName role");

    return res.status(201).json({
      success: true,
      message: "Volunteer involvement saved successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create volunteer involvement.",
    });
  }
};

/**
 * Delete Volunteer Involvement
 * DELETE /api/volunteer/involvements/:id
 * Access: Protected | Allowed: admin
 */
export const deleteVolunteerInvolvement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid involvement ID is required.",
      });
    }

    const result = await VolunteerInvolvement.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Volunteer involvement not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Volunteer involvement removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete volunteer involvement.",
    });
  }
};

// =========================================================================
// PART C: VOLUNTEER ATTENDANCE (STAFF/ADMIN MARKED)
// =========================================================================

/**
 * Get Volunteer Attendance Records
 * GET /api/volunteer/attendance
 * Access: Protected | Allowed: volunteer (own), admin (all)
 */
export const getVolunteerAttendance = async (req, res) => {
  try {
    const { volunteerId, eventId, activityType, date } = req.query;

    const query = { isDeleted: false };

    if (req.user.role === "volunteer") {
      query.volunteerId = req.user._id;
    } else if (req.user.role === "admin") {
      if (volunteerId && mongoose.Types.ObjectId.isValid(volunteerId)) {
        query.volunteerId = volunteerId;
      }
      if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        query.eventId = eventId;
      }
    }

    if (activityType && ["event", "meeting", "session", "other"].includes(activityType.toLowerCase())) {
      query.activityType = activityType.toLowerCase();
    }

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d.setHours(0, 0, 0, 0));
        const endOfDay = new Date(d.setHours(23, 59, 59, 999));
        query.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const records = await VolunteerAttendance.find(query)
      .populate("volunteerId", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("markedBy", "name fullName role")
      .sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteer attendance.",
    });
  }
};

/**
 * Mark Volunteer Attendance
 * POST /api/volunteer/attendance
 * Access: Protected | Allowed: admin
 */
export const markVolunteerAttendance = async (req, res) => {
  try {
    const {
      volunteerId,
      activityType,
      eventId,
      eventName,
      meetingPlace,
      date,
      time,
      venue,
      topic,
      extraDescription,
      attendanceStatus,
    } = req.body;

    if (!volunteerId || !mongoose.Types.ObjectId.isValid(volunteerId)) {
      return res.status(400).json({
        success: false,
        message: "A valid volunteer ID is required.",
      });
    }

    const volunteer = await User.findOne({
      _id: volunteerId,
      isDeleted: false,
      accountStatus: "active",
    });

    if (!volunteer || volunteer.role !== "volunteer") {
      return res.status(400).json({
        success: false,
        message: "Target user is not an active volunteer.",
      });
    }

    let normActivity = (activityType || "event").toLowerCase().trim();
    if (normActivity.includes("event") || normActivity.includes("duty")) {
      normActivity = "event";
    } else if (normActivity.includes("meet")) {
      normActivity = "meeting";
    } else if (normActivity.includes("sess")) {
      normActivity = "session";
    } else if (!["event", "meeting", "session", "other"].includes(normActivity)) {
      normActivity = "event";
    }

    let linkedEventId = null;
    let resolvedEventName = eventName || "";
    let resolvedDate = date;
    let resolvedTime = time;
    let resolvedVenue = venue || meetingPlace || "";

    if (eventId) {
      if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid event ID provided.",
        });
      }
      const event = await Event.findOne({ _id: eventId, isDeleted: false });
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Referenced event does not exist or has been deleted.",
        });
      }
      linkedEventId = event._id;
      if (!resolvedEventName) resolvedEventName = event.name;
      if (!resolvedDate) resolvedDate = event.date || event.eventDate || new Date();
      if (!resolvedTime) resolvedTime = event.startTime || "10:00 AM";
      if (!resolvedVenue) resolvedVenue = event.venue || "Campus";
    }

    if (!resolvedDate) resolvedDate = new Date();
    if (!resolvedTime) resolvedTime = "10:00 AM";

    const record = await VolunteerAttendance.create({
      volunteerId: volunteer._id,
      activityType: normActivity,
      eventId: linkedEventId,
      eventName: resolvedEventName,
      meetingPlace: resolvedVenue,
      date: new Date(resolvedDate),
      time: resolvedTime.trim(),
      venue: resolvedVenue,
      topic: topic || "",
      extraDescription: extraDescription || "",
      attendanceStatus: attendanceStatus === "absent" ? "absent" : "present",
      markedBy: req.user._id,
    });

    const populated = await VolunteerAttendance.findById(record._id)
      .populate("volunteerId", "name fullName email role department enrollmentNumber enrollmentNo")
      .populate("eventId", "name date eventDate venue category status")
      .populate("markedBy", "name fullName role");

    return res.status(201).json({
      success: true,
      message: "Volunteer attendance recorded successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark volunteer attendance.",
    });
  }
};

/**
 * Soft Delete Volunteer Attendance
 * DELETE /api/volunteer/attendance/:id
 * Access: Protected | Allowed: admin
 */
export const deleteVolunteerAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid attendance ID is required.",
      });
    }

    const record = await VolunteerAttendance.findOne({ _id: id, isDeleted: false });
    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Volunteer attendance record not found.",
      });
    }

    record.isDeleted = true;
    record.deletedAt = new Date();
    record.deletedBy = req.user._id;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Volunteer attendance record deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete volunteer attendance.",
    });
  }
};

// =========================================================================
// PART D: VOLUNTEER DASHBOARD & STATS
// =========================================================================

/**
 * Get Volunteer Dashboard Statistics
 * GET /api/volunteer/dashboard-stats
 * Access: Protected | Allowed: volunteer, admin
 */
export const getVolunteerDashboardStats = async (req, res) => {
  try {
    const volunteerId =
      req.user.role === "volunteer"
        ? req.user._id
        : req.query.volunteerId && mongoose.Types.ObjectId.isValid(req.query.volunteerId)
        ? req.query.volunteerId
        : null;

    const totalEvents = await Event.countDocuments({ isDeleted: false });
    const upcomingEvents = await Event.countDocuments({
      isDeleted: false,
      status: { $in: ["published", "upcoming", "registration_open"] },
    });
    const totalVolunteers = await User.countDocuments({
      role: "volunteer",
      isDeleted: false,
      accountStatus: "active",
    });
    const totalStudents = await User.countDocuments({
      role: "student",
      isDeleted: false,
      accountStatus: "active",
    });
    const totalRegistrations = await Registration.countDocuments({
      isDeleted: false,
      status: "registered",
    });
    const totalAttendances = await Attendance.countDocuments({
      isDeleted: false,
      status: "present",
    });
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttendances / totalRegistrations) * 100) : 0;

    const upcomingList = await Event.find({
      isDeleted: false,
      status: { $in: ["published", "upcoming", "registration_open"] },
    })
      .sort({ date: 1, eventDate: 1 })
      .limit(4);

    let volunteerStats = {};
    if (volunteerId) {
      const totalTasks = await VolunteerTask.countDocuments({
        assignedTo: volunteerId,
        isDeleted: false,
      });
      const completedTasks = await VolunteerTask.countDocuments({
        assignedTo: volunteerId,
        completed: true,
        isDeleted: false,
      });
      const attendanceRecords = await VolunteerAttendance.countDocuments({
        volunteerId,
        attendanceStatus: "present",
        isDeleted: false,
      });
      const totalInvolvements = await VolunteerInvolvement.countDocuments({
        volunteerId,
      });
      volunteerStats = {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        attendanceCount: attendanceRecords,
        totalInvolvements,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    } else {
      const totalTasks = await VolunteerTask.countDocuments({ isDeleted: false });
      const completedTasks = await VolunteerTask.countDocuments({
        isDeleted: false,
        completed: true,
      });
      volunteerStats = {
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        totalEvents,
        upcomingEvents,
        totalVolunteers,
        totalStudents,
        totalRegistrations,
        attendanceRate,
        totalAttendances,
        upcomingList,
        ...volunteerStats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard statistics.",
    });
  }
};

export default {
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
};
