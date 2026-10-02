import User from "../models/User.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import Attendance from "../models/Attendance.js";
import Certificate from "../models/Certificate.js";
import Report from "../models/Report.js";
import AuditLog from "../models/AuditLog.js";
import GlobalSettings from "../models/GlobalSettings.js";
import AboutTCF from "../models/AboutTCF.js";

/**
 * Admin Controller
 * Handles Platform-wide Analytics & Metrics, Event Reports & Reviews,
 * System Audit Logging, Global Configuration Settings, and About TCF Management.
 */

// Helper to record audit logs safely
const createAuditRecord = async (performedBy, action, entityType, entityId, description, metadata = {}) => {
  try {
    await AuditLog.create({
      performedBy,
      action,
      entityType,
      entityId,
      description,
      metadata,
    });
  } catch (err) {
    console.error("⚠️ [Audit Log] Failed to record audit log:", err.message);
  }
};

// =========================================================================
// 1. GET ADMIN DASHBOARD STATS (Admin Only)
// =========================================================================
export const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalStudents,
      totalVolunteers,
      totalAdmins,
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      pastEvents,
      totalRegistrations,
      totalAttendances,
      totalCertificates,
    ] = await Promise.all([
      User.countDocuments({ role: "student", isDeleted: false }),
      User.countDocuments({ role: "volunteer", isDeleted: false }),
      User.countDocuments({ role: "admin", isDeleted: false }),
      Event.countDocuments({ isDeleted: false }),
      Event.countDocuments({ status: "upcoming", isDeleted: false }),
      Event.countDocuments({ status: "ongoing", isDeleted: false }),
      Event.countDocuments({ status: "completed", isDeleted: false }),
      Registration.countDocuments({ isCancelled: false }),
      Attendance.countDocuments({ isDeleted: false }),
      Certificate.countDocuments({ isRevoked: false }),
    ]);

    // Department-wise student breakdown
    const departmentBreakdown = await User.aggregate([
      { $match: { role: "student", isDeleted: false, department: { $ne: "" } } },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent 5 registrations
    const recentRegistrations = await Registration.find({ isCancelled: false })
      .populate("studentId", "fullName enrollmentNumber email department")
      .populate("eventId", "title eventDate venue")
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 events
    const recentEvents = await Event.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title eventDate venue status capacity registeredCount");

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          totalStudents,
          totalVolunteers,
          totalAdmins,
          totalUsers: totalStudents + totalVolunteers + totalAdmins,
        },
        events: {
          totalEvents,
          upcomingEvents,
          ongoingEvents,
          pastEvents,
        },
        activity: {
          totalRegistrations,
          totalAttendances,
          totalCertificates,
        },
        departments: departmentBreakdown.map((d) => ({
          department: d._id,
          students: d.count,
        })),
        recentRegistrations: recentRegistrations.map((r) => r.toObject({ virtuals: true })),
        recentEvents: recentEvents.map((e) => e.toObject({ virtuals: true })),
      },
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getAdminDashboardStats Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load admin dashboard statistics.",
    });
  }
};

// =========================================================================
// 2. GET SYSTEM AUDIT LOGS (Admin Only)
// =========================================================================
export const getAuditLogs = async (req, res) => {
  try {
    const { action, entityType, page = 1, limit = 25 } = req.query;

    const query = {};
    if (action && action.trim()) query.action = action.trim().toUpperCase();
    if (entityType && entityType.trim()) query.entityType = entityType.trim().toLowerCase();

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 25;
    const skip = (pageNum - 1) * limitNum;

    const totalLogs = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate("performedBy", "fullName email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: logs.length,
      totalLogs,
      totalPages: Math.ceil(totalLogs / limitNum),
      currentPage: pageNum,
      logs,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getAuditLogs Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve audit logs.",
    });
  }
};

// =========================================================================
// 3. UPLOAD EVENT REPORT (Volunteer & Admin)
// =========================================================================
export const uploadEventReport = async (req, res) => {
  try {
    const { eventId, reportUrl, comment } = req.body;

    if (!eventId || !reportUrl || !reportUrl.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event ID and Report PDF URL are required.",
      });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Check if report already exists for this event (Exactly ONE report per event, Section 9.5)
    let report = await Report.findOne({ eventId: event._id });

    if (report) {
      if (report.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Report for this event has already been approved and cannot be replaced.",
        });
      }

      // Update existing report with resubmission
      report.reportUrl = reportUrl.trim();
      report.status = "resubmitted";
      report.uploadedBy = req.user._id;
      report.uploadedAt = new Date();
      report.history.push({
        action: "resubmitted",
        performedBy: req.user._id,
        comment: (comment || "Resubmitted updated report PDF").trim(),
      });

      await report.save();

      await createAuditRecord(
        req.user._id,
        "REPORT_RESUBMITTED",
        "report",
        report._id,
        `Report resubmitted for event '${event.title}'`
      );

      return res.status(200).json({
        success: true,
        message: "Report resubmitted successfully for admin review.",
        report,
      });
    }

    // Create new report
    report = await Report.create({
      eventId: event._id,
      uploadedBy: req.user._id,
      reportUrl: reportUrl.trim(),
      status: "pending",
      history: [
        {
          action: "uploaded",
          performedBy: req.user._id,
          comment: (comment || "Initial report upload").trim(),
        },
      ],
    });

    await createAuditRecord(
      req.user._id,
      "REPORT_UPLOADED",
      "report",
      report._id,
      `Report uploaded for event '${event.title}'`
    );

    return res.status(201).json({
      success: true,
      message: "Event report uploaded successfully and submitted for admin review.",
      report,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] uploadEventReport Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload event report.",
    });
  }
};

// =========================================================================
// 4. GET ALL EVENT REPORTS (Volunteer & Admin)
// =========================================================================
export const getAllReports = async (req, res) => {
  try {
    const { status, eventId, page = 1, limit = 20 } = req.query;

    const query = { isDeleted: false };
    if (status && status.trim()) query.status = status.trim().toLowerCase();
    if (eventId) query.eventId = eventId;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const totalReports = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate("eventId", "title eventDate venue status banner")
      .populate("uploadedBy", "fullName email role")
      .populate("history.performedBy", "fullName role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      count: reports.length,
      totalReports,
      totalPages: Math.ceil(totalReports / limitNum),
      currentPage: pageNum,
      reports,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getAllReports Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve reports.",
    });
  }
};

// =========================================================================
// 5. GET REPORT BY ID (Volunteer & Admin)
// =========================================================================
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findOne({ _id: id, isDeleted: false })
      .populate("eventId", "title eventDate venue status banner description")
      .populate("uploadedBy", "fullName email role")
      .populate("history.performedBy", "fullName email role");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Event report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getReportById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve report details.",
    });
  }
};

// =========================================================================
// 6. REVIEW EVENT REPORT (Admin Only - Approve or Reject)
// =========================================================================
export const reviewEventReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!action || !["approved", "rejected"].includes(action.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Review action must be 'approved' or 'rejected'.",
      });
    }

    const reviewAction = action.toLowerCase();
    const report = await Report.findOne({ _id: id, isDeleted: false }).populate("eventId", "title");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    report.status = reviewAction;
    report.history.push({
      action: reviewAction,
      performedBy: req.user._id,
      comment: (comment || `Report ${reviewAction} by admin`).trim(),
    });

    await report.save();

    await createAuditRecord(
      req.user._id,
      reviewAction === "approved" ? "REPORT_APPROVED" : "REPORT_REJECTED",
      "report",
      report._id,
      `Report for event '${report.eventId?.title || ""}' was ${reviewAction}`,
      { comment }
    );

    return res.status(200).json({
      success: true,
      message: `Report has been successfully ${reviewAction}.`,
      report,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] reviewEventReport Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to process report review.",
    });
  }
};

// =========================================================================
// 7. GET GLOBAL SETTINGS (Admin Only)
// =========================================================================
export const getGlobalSettings = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne({ key: "system_settings" });

    if (!settings) {
      settings = await GlobalSettings.create({ key: "system_settings" });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getGlobalSettings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load global settings.",
    });
  }
};

// =========================================================================
// 8. UPDATE GLOBAL SETTINGS (Admin Only)
// =========================================================================
export const updateGlobalSettings = async (req, res) => {
  try {
    const { qr, attendance, academic, registration, security, softDelete } = req.body;

    let settings = await GlobalSettings.findOne({ key: "system_settings" });
    if (!settings) {
      settings = new GlobalSettings({ key: "system_settings" });
    }

    if (qr) settings.qr = { ...settings.qr, ...qr };
    if (attendance) settings.attendance = { ...settings.attendance, ...attendance };
    if (academic) settings.academic = { ...settings.academic, ...academic };
    if (registration) settings.registration = { ...settings.registration, ...registration };
    if (security) settings.security = { ...settings.security, ...security };
    if (softDelete) settings.softDelete = { ...settings.softDelete, ...softDelete };

    await settings.save();

    await createAuditRecord(
      req.user._id,
      "SETTINGS_UPDATED",
      "settings",
      settings._id,
      "System global configuration settings updated"
    );

    return res.status(200).json({
      success: true,
      message: "System settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] updateGlobalSettings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update global settings.",
    });
  }
};

// =========================================================================
// 9. GET ABOUT TCF (Public)
// =========================================================================
export const getAboutTCF = async (req, res) => {
  try {
    let about = await AboutTCF.findOne();

    if (!about) {
      // Create sensible default if none exists yet
      about = await AboutTCF.create({
        organizationName: "The Cyber Force (TCF)",
        vision: "Fostering excellence in cybersecurity, ethical hacking, and technology awareness across students and academia.",
        mission: "To deliver hands-on workshops, cyber defense masterclasses, and capture-the-flag competitions empowering future cybersecurity professionals.",
        description: "The Cyber Force (TCF) is the premier student-led technical organization dedicated to cultivating cyber awareness, defense skills, and cutting-edge digital literacy.",
        teamMembers: [],
        contactInfo: {
          email: "contact@tcf.demo",
          phone: "+91 98765 43210",
          address: "Vishwakarma Government Engineering College, Chandkheda, Ahmedabad",
          website: "https://tcf.example.com",
        },
      });
    }

    return res.status(200).json({
      success: true,
      about,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] getAboutTCF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve About TCF information.",
    });
  }
};

// =========================================================================
// 10. UPDATE ABOUT TCF (Admin Only)
// =========================================================================
export const updateAboutTCF = async (req, res) => {
  try {
    const { organizationName, vision, mission, description, teamMembers, contactInfo } = req.body;

    let about = await AboutTCF.findOne();
    if (!about) {
      about = new AboutTCF();
    }

    if (organizationName !== undefined) about.organizationName = organizationName.trim();
    if (vision !== undefined) about.vision = vision.trim();
    if (mission !== undefined) about.mission = mission.trim();
    if (description !== undefined) about.description = description.trim();
    if (Array.isArray(teamMembers)) about.teamMembers = teamMembers;
    if (contactInfo && typeof contactInfo === "object") {
      about.contactInfo = { ...about.contactInfo, ...contactInfo };
    }

    about.lastUpdatedBy = req.user._id;
    await about.save();

    await createAuditRecord(
      req.user._id,
      "ABOUT_TCF_UPDATED",
      "about",
      about._id,
      "About TCF organization information updated"
    );

    return res.status(200).json({
      success: true,
      message: "About TCF details updated successfully.",
      about,
    });
  } catch (error) {
    console.error("❌ [Admin Controller] updateAboutTCF Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update About TCF information.",
    });
  }
};

export default {
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
};
