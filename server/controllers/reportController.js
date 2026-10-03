import mongoose from "mongoose";
import Report from "../models/Report.js";
import Event from "../models/Event.js";

/**
 * Get All Reports
 * GET /api/reports
 * Access: Protected | Allowed: volunteer, admin
 */
export const getReports = async (req, res) => {
  try {
    const { eventId, status, search } = req.query;
    const query = { isDeleted: false };

    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
      query.eventId = eventId;
    }

    if (status && status !== "All") {
      const normalizedStatus = status.toLowerCase().includes("pending")
        ? "pending"
        : status.toLowerCase().includes("approved")
        ? "approved"
        : status.toLowerCase().includes("revision") || status.toLowerCase().includes("rejected")
        ? "rejected"
        : status.toLowerCase();
      query.status = normalizedStatus;
    }

    const reports = await Report.find(query)
      .populate("eventId", "name date eventDate venue category status poster")
      .populate("uploadedBy", "fullName name email enrollmentNumber role")
      .populate("history.performedBy", "fullName name role")
      .sort({ uploadedAt: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reports.",
    });
  }
};

/**
 * Get Single Report by ID
 * GET /api/reports/:id
 * Access: Protected | Allowed: volunteer, admin
 */
export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid report ID is required.",
      });
    }

    const report = await Report.findOne({ _id: id, isDeleted: false })
      .populate("eventId", "name date eventDate venue category status poster")
      .populate("uploadedBy", "fullName name email enrollmentNumber role")
      .populate("history.performedBy", "fullName name role");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch report.",
    });
  }
};

/**
 * Upload / Submit Event Report
 * POST /api/reports
 * Access: Protected | Allowed: volunteer, admin
 */
export const uploadReport = async (req, res) => {
  try {
    const file = req.file || (req.files && req.files[0]);
    const eventId = req.body.eventId;
    const comment = req.body.comment || "";
    let reportUrl = req.body.reportUrl;

    if (file) {
      reportUrl = `/uploads/${file.filename}`;
    }

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required to submit a report.",
      });
    }

    if (!reportUrl) {
      return res.status(400).json({
        success: false,
        message: "Please upload a report file (PDF, Word, or Excel).",
      });
    }

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    let report = await Report.findOne({ eventId, isDeleted: false });

    if (report) {
      report.reportUrl = reportUrl;
      report.uploadedBy = req.user._id;
      report.status = "pending";
      report.uploadedAt = new Date();
      report.history.push({
        action: "resubmitted",
        performedBy: req.user._id,
        performedAt: new Date(),
        comment: comment || "Report resubmitted by volunteer",
      });
      await report.save();
    } else {
      report = await Report.create({
        eventId,
        uploadedBy: req.user._id,
        reportUrl,
        status: "pending",
        uploadedAt: new Date(),
        history: [
          {
            action: "uploaded",
            performedBy: req.user._id,
            performedAt: new Date(),
            comment: comment || "Initial report upload",
          },
        ],
      });
    }

    const populated = await Report.findById(report._id)
      .populate("eventId", "name date eventDate venue category status poster")
      .populate("uploadedBy", "fullName name email enrollmentNumber role")
      .populate("history.performedBy", "fullName name role");

    return res.status(201).json({
      success: true,
      message: "Event report submitted successfully.",
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit event report.",
    });
  }
};

/**
 * Update Report Status (Approve / Reject / Revision)
 * PUT /api/reports/:id/status
 * Access: Protected | Allowed: admin
 */
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid report ID is required.",
      });
    }

    const validStatuses = ["pending", "approved", "rejected", "resubmitted"];
    const normalized = (status || "").toLowerCase().trim();

    if (!validStatuses.includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: `Invalid report status. Allowed: ${validStatuses.join(", ")}`,
      });
    }

    const report = await Report.findOne({ _id: id, isDeleted: false });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    report.status = normalized;
    const action = normalized === "rejected" ? "rejected" : normalized === "approved" ? "approved" : "resubmitted";

    report.history.push({
      action,
      performedBy: req.user._id,
      performedAt: new Date(),
      comment: comment || `Status updated to ${normalized} by admin`,
    });

    await report.save();

    const populated = await Report.findById(report._id)
      .populate("eventId", "name date eventDate venue category status poster")
      .populate("uploadedBy", "fullName name email enrollmentNumber role")
      .populate("history.performedBy", "fullName name role");

    return res.status(200).json({
      success: true,
      message: `Report status updated to ${normalized}.`,
      data: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update report status.",
    });
  }
};

/**
 * Delete Report (Soft Delete)
 * DELETE /api/reports/:id
 * Access: Protected | Allowed: admin
 */
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid report ID is required.",
      });
    }

    const report = await Report.findOne({ _id: id, isDeleted: false });
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    report.isDeleted = true;
    report.deletedAt = new Date();
    report.deletedBy = req.user._id;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Report deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete report.",
    });
  }
};
