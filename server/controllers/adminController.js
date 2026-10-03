import mongoose from "mongoose";
import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import Feedback from "../models/Feedback.js";
import VolunteerTask from "../models/VolunteerTask.js";
import VolunteerAttendance from "../models/VolunteerAttendance.js";
import VolunteerInvolvement from "../models/VolunteerInvolvement.js";
import Gallery from "../models/Gallery.js";
import LearningResource from "../models/LearningResource.js";
import AboutTCF from "../models/AboutTCF.js";
import GlobalSettings from "../models/GlobalSettings.js";

/**
 * Get Comprehensive Admin Dashboard Statistics
 * GET /api/admin/dashboard-stats
 * Access: Protected | Allowed Roles: admin
 */
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({
      role: "student",
      isDeleted: false,
      accountStatus: "active",
    });

    const totalVolunteers = await User.countDocuments({
      role: "volunteer",
      isDeleted: false,
      accountStatus: "active",
    });

    const totalEvents = await Event.countDocuments({ isDeleted: false });
    const upcomingEvents = await Event.countDocuments({
      isDeleted: false,
      status: { $in: ["published", "registration_open"] },
    });
    const completedEvents = await Event.countDocuments({
      isDeleted: false,
      status: "completed",
    });

    const totalRegistrations = await Registration.countDocuments({
      isDeleted: false,
      status: { $in: ["registered", "confirmed", "attended"] },
    });

    const totalAttendance = await Attendance.countDocuments({
      isDeleted: false,
      status: "present",
    });

    const totalCertificates = await Certificate.countDocuments({
      isDeleted: false,
    });

    const totalFeedback = await Feedback.countDocuments({
      isDeleted: false,
    });

    const totalVolunteerTasks = await VolunteerTask.countDocuments({
      isDeleted: false,
    });

    const completedVolunteerTasks = await VolunteerTask.countDocuments({
      isDeleted: false,
      completed: true,
    });

    const recentRegistrations = await Registration.find({ isDeleted: false })
      .populate("studentId", "fullName name email enrollmentNumber department")
      .populate("eventId", "name date venue status")
      .sort({ createdAt: -1 })
      .limit(5);

    const recentEvents = await Event.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalVolunteers,
        totalUsers: totalStudents + totalVolunteers + 1,
        totalEvents,
        upcomingEvents,
        completedEvents,
        totalRegistrations,
        totalAttendance,
        attendanceRate:
          totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0,
        totalCertificates,
        totalFeedback,
        totalVolunteerTasks,
        completedVolunteerTasks,
        taskCompletionRate:
          totalVolunteerTasks > 0
            ? Math.round((completedVolunteerTasks / totalVolunteerTasks) * 100)
            : 0,
        recentRegistrations,
        recentEvents,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch admin dashboard statistics.",
    });
  }
};

/**
 * Get All System Users (with filters & search)
 * GET /api/admin/users
 * Access: Protected | Allowed Roles: admin
 */
export const getUsers = async (req, res) => {
  try {
    const { role, accountStatus, department, search, limit = 100 } = req.query;

    const query = { isDeleted: false };

    if (role && ["student", "volunteer", "admin"].includes(role.toLowerCase())) {
      query.role = role.toLowerCase();
    }

    if (accountStatus && ["active", "suspended", "pending_verification"].includes(accountStatus.toLowerCase())) {
      query.accountStatus = accountStatus.toLowerCase();
    }

    if (department && department.trim()) {
      query.department = department.trim().toUpperCase();
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: regex },
        { email: regex },
        { enrollmentNumber: regex },
      ];
    }

    const users = await User.find(query)
      .populate("committeePosition")
      .populate("workingUnder", "fullName email")
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const formatted = users.map((u) => ({
      _id: u._id,
      id: u._id,
      fullName: u.fullName,
      name: u.fullName,
      email: u.email,
      enrollmentNumber: u.enrollmentNumber,
      enrollmentNo: u.enrollmentNumber,
      role: u.role,
      department: u.department,
      semester: u.semester,
      currentYear: u.currentYear,
      year: u.year,
      batch: u.batch,
      phoneNumber: u.phoneNumber,
      phone: u.phoneNumber,
      profilePhoto: u.profilePhoto || "",
      accountStatus: u.accountStatus,
      isEmailVerified: u.isEmailVerified,
      committeePosition: u.committeePosition,
      designation: u.committeePosition?.name || (u.role === "volunteer" ? "Volunteer" : u.role),
      workingUnder: u.workingUnder?.fullName || "",
      createdAt: u.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users.",
    });
  }
};

/**
 * Get Specific User by ID
 * GET /api/admin/users/:id
 * Access: Protected | Allowed Roles: admin
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false })
      .populate("committeePosition")
      .populate("workingUnder", "fullName email")
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user.",
    });
  }
};

/**
 * Create Volunteer Account (Admin Managed)
 * POST /api/admin/volunteers
 * Access: Protected | Allowed Roles: admin
 */
export const createVolunteerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      enrollmentNumber,
      department,
      semester,
      batch,
      phoneNumber,
      profilePhoto,
      committeePosition,
      workingUnder,
    } = req.body;

    if (!fullName || !email || !password || !enrollmentNumber || !department) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, password, enrollment number, and department are required.",
      });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const existingEnroll = await User.findOne({
      enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
    });
    if (existingEnroll) {
      return res.status(400).json({
        success: false,
        message: "User with this enrollment number already exists.",
      });
    }

    let batchObj = batch;
    if (!batchObj || !batchObj.startYear) {
      const currentYr = 2026;
      batchObj = { startYear: currentYr - 2, endYear: currentYr + 2 };
    }

    const newVolunteer = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "volunteer",
      enrollmentNumber: enrollmentNumber.trim().toUpperCase(),
      department: department.trim().toUpperCase(),
      semester: Number(semester) || 6,
      batch: batchObj,
      phoneNumber: phoneNumber || "9876543210",
      profilePhoto: profilePhoto || "https://example.com/volunteer-default.jpg",
      committeePosition: committeePosition || new mongoose.Types.ObjectId(),
      workingUnder: workingUnder || req.user._id,
      accountStatus: "active",
      isEmailVerified: true,
    });

    const populated = await User.findById(newVolunteer._id)
      .select("-password")
      .populate("committeePosition")
      .populate("workingUnder", "fullName email");

    return res.status(201).json({
      success: true,
      message: "Volunteer account created successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create volunteer account.",
    });
  }
};

/**
 * Update User Account Status (Activate / Suspend)
 * PUT /api/admin/users/:id/status
 * Access: Protected | Allowed Roles: admin
 */
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required.",
      });
    }

    if (!accountStatus || !["active", "suspended", "pending_verification"].includes(accountStatus.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status. Allowed: active, suspended, pending_verification",
      });
    }

    // Prevent self-suspension by admin
    if (String(id) === String(req.user._id) && accountStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "You cannot suspend your own admin account.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.accountStatus = accountStatus.toLowerCase();
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account status updated to ${accountStatus}.`,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user account status.",
    });
  }
};

/**
 * Soft Delete User Account
 * DELETE /api/admin/users/:id
 * Access: Protected | Allowed Roles: admin
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid user ID is required.",
      });
    }

    if (String(id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account.",
      });
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user._id;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete user account.",
    });
  }
};

/**
 * Get System Analysis & Performance Metrics
 * GET /api/admin/analysis
 * Access: Protected | Allowed Roles: admin
 */
export const getSystemAnalysis = async (req, res) => {
  try {
    const events = await Event.find({ isDeleted: false }).select("name category registeredCount attendedCount participantsLimit date status");
    
    // Live aggregations
    const regCounts = await Registration.aggregate([
      { $match: { isDeleted: false, status: { $in: ["registered", "confirmed", "attended"] } } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);
    const attCounts = await Attendance.aggregate([
      { $match: { isDeleted: false, status: "present" } },
      { $group: { _id: "$eventId", count: { $sum: 1 } } }
    ]);
    const regMap = new Map(regCounts.map((r) => [r._id.toString(), r.count]));
    const attMap = new Map(attCounts.map((a) => [a._id.toString(), a.count]));

    const eventsPerformance = events.map((ev) => {
      const evObj = ev.toObject();
      const regCount = regMap.get(ev._id.toString()) || ev.registeredCount || 0;
      const attCount = attMap.get(ev._id.toString()) || ev.attendedCount || 0;
      return {
        ...evObj,
        registeredCount: regCount,
        attendedCount: attCount,
      };
    });

    const totalStudents = await User.countDocuments({ role: "student", isDeleted: false, accountStatus: "active" });
    const totalVolunteers = await User.countDocuments({ role: "volunteer", isDeleted: false, accountStatus: "active" });
    const totalRegistrations = await Registration.countDocuments({
      isDeleted: false,
      status: { $in: ["registered", "confirmed", "attended"] },
    });
    const totalAttendance = await Attendance.countDocuments({ isDeleted: false, status: "present" });
    const totalFeedback = await Feedback.countDocuments({ isDeleted: false });
    const totalCertificates = await Certificate.countDocuments({ isDeleted: false });

    // Category breakdown
    const categoryMap = {};
    eventsPerformance.forEach((ev) => {
      const cat = ev.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, registrations: 0, attendance: 0 };
      categoryMap[cat].count += 1;
      categoryMap[cat].registrations += ev.registeredCount || 0;
      categoryMap[cat].attendance += ev.attendedCount || 0;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalVolunteers,
        totalEvents: events.length,
        totalRegistrations,
        totalAttendance,
        totalFeedback,
        totalCertificates,
        overallAttendanceRate:
          totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0,
        categoryBreakdown: categoryMap,
        eventsPerformance,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch system analysis.",
    });
  }
};

/**
 * Get About TCF Content
 * GET /api/admin/about
 * Access: Public / Authenticated
 */
export const getAboutTCF = async (req, res) => {
  try {
    let about = await AboutTCF.findOne();
    if (!about) {
      about = await AboutTCF.create({
        organizationName: "The Cyber Force (TCF)",
        vision: "Fostering cybersecurity excellence and leadership at VGEC.",
        mission: "Educating, inspiring, and empowering the next generation of cybersecurity defenders.",
        description: "TCF is the premier student cybersecurity club of Vishwakarma Government Engineering College.",
        teamMembers: [
          { name: "Prof. TCF Mentor", role: "Faculty Advisor", description: "Department of IT, VGEC", order: 1 },
          { name: "Student Lead", role: "Club President", description: "Final Year IT", order: 2 },
        ],
      });
    }

    return res.status(200).json({
      success: true,
      data: about,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch About TCF information.",
    });
  }
};

/**
 * Update About TCF Content
 * PUT /api/admin/about
 * Access: Protected | Allowed Roles: admin
 */
export const updateAboutTCF = async (req, res) => {
  try {
    const { organizationName, vision, mission, description, contactInfo, teamMembers } = req.body;

    let about = await AboutTCF.findOne();
    if (!about) {
      about = new AboutTCF();
    }

    if (organizationName) about.organizationName = organizationName;
    if (vision) about.vision = vision;
    if (mission) about.mission = mission;
    if (description) about.description = description;
    if (contactInfo) about.contactInfo = contactInfo;
    if (Array.isArray(teamMembers)) about.teamMembers = teamMembers;

    about.lastUpdatedBy = req.user._id;
    await about.save();

    return res.status(200).json({
      success: true,
      message: "About TCF information updated successfully.",
      data: about,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update About TCF information.",
    });
  }
};

/**
 * Get Global Settings
 * GET /api/admin/settings
 * Access: Protected | Allowed Roles: admin
 */
export const getGlobalSettings = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne({ key: "system_settings" });
    if (!settings) {
      settings = await GlobalSettings.create({ key: "system_settings" });
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch global settings.",
    });
  }
};

/**
 * Update Global Settings
 * PUT /api/admin/settings
 * Access: Protected | Allowed Roles: admin
 */
export const updateGlobalSettings = async (req, res) => {
  try {
    const { qr, attendance, academic, registration, security } = req.body;

    let settings = await GlobalSettings.findOne({ key: "system_settings" });
    if (!settings) {
      settings = new GlobalSettings({ key: "system_settings" });
    }

    if (qr) settings.qr = { ...settings.qr, ...qr };
    if (attendance) settings.attendance = { ...settings.attendance, ...attendance };
    if (academic) settings.academic = { ...settings.academic, ...academic };
    if (registration) settings.registration = { ...settings.registration, ...registration };
    if (security) settings.security = { ...settings.security, ...security };

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Global settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update global settings.",
    });
  }
};

export default {
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
};
