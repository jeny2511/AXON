import mongoose from "mongoose";
import Feedback from "../models/Feedback.js";
import Attendance from "../models/Attendance.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";

/**
 * Submit Event Feedback
 * POST /api/feedback
 * Access: Protected | Allowed Roles: student
 */
export const submitFeedback = async (req, res) => {
  try {
    const student = req.user;
    const {
      eventId,
      overallRating,
      speakerRating,
      contentRating,
      organizationRating,
      wouldRecommend,
      comment,
      isAnonymous,
    } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    // 1. Verify Event exists and is not deleted
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or has been deleted.",
      });
    }

    // 2. Verify student has valid registration
    const registration = await Registration.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
      status: "registered",
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "You are not registered for this event.",
      });
    }

    // 3. Verify student has valid Present attendance
    const attendance = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
      status: "present",
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "You can only submit feedback for events you have attended.",
      });
    }

    // 4. Duplicate feedback check
    const existingFeedback = await Feedback.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event.",
      });
    }

    // 5. Validation of ratings
    const parsedOverall = Number(overallRating);
    if (!parsedOverall || parsedOverall < 1 || parsedOverall > 5) {
      return res.status(400).json({
        success: false,
        message: "Overall rating is required and must be between 1 and 5.",
      });
    }

    const parsedSpeaker = speakerRating !== undefined ? Number(speakerRating) : 5;
    const parsedContent = contentRating !== undefined ? Number(contentRating) : 5;
    const parsedOrg = organizationRating !== undefined ? Number(organizationRating) : 5;

    if (
      [parsedSpeaker, parsedContent, parsedOrg].some((r) => isNaN(r) || r < 1 || r > 5)
    ) {
      return res.status(400).json({
        success: false,
        message: "All rating fields must be valid numbers between 1 and 5.",
      });
    }

    // 6. Create Feedback record
    const feedback = await Feedback.create({
      eventId: event._id,
      studentId: student._id,
      overallRating: parsedOverall,
      speakerRating: parsedSpeaker,
      contentRating: parsedContent,
      organizationRating: parsedOrg,
      wouldRecommend: wouldRecommend !== undefined ? Boolean(wouldRecommend) : true,
      comment: (comment || "").trim(),
      isAnonymous: Boolean(isAnonymous),
      editable: false,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! Thank you for your review.",
      data: feedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this event.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit feedback.",
    });
  }
};

/**
 * Get Authenticated Student's Feedback Submissions
 * GET /api/feedback/my
 * Access: Protected | Allowed Roles: student
 */
export const getMyFeedback = async (req, res) => {
  try {
    const feedbackList = await Feedback.find({
      studentId: req.user._id,
      isDeleted: false,
    })
      .populate("eventId", "name date eventDate venue category status")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      data: feedbackList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student feedback records.",
    });
  }
};

/**
 * Get Feedback for a Specific Event
 * GET /api/feedback/event/:eventId
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getEventFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const feedbackList = await Feedback.find({
      eventId,
      isDeleted: false,
    })
      .populate("studentId", "fullName name enrollmentNumber enrollmentNo department year")
      .sort({ createdAt: -1 });

    // Calculate summary statistics
    let avgOverall = 0;
    let avgSpeaker = 0;
    let avgContent = 0;
    let avgOrg = 0;
    let recommendPercent = 0;

    if (feedbackList.length > 0) {
      avgOverall =
        feedbackList.reduce((acc, f) => acc + (f.overallRating || 0), 0) /
        feedbackList.length;
      avgSpeaker =
        feedbackList.reduce((acc, f) => acc + (f.speakerRating || 0), 0) /
        feedbackList.length;
      avgContent =
        feedbackList.reduce((acc, f) => acc + (f.contentRating || 0), 0) /
        feedbackList.length;
      avgOrg =
        feedbackList.reduce((acc, f) => acc + (f.organizationRating || 0), 0) /
        feedbackList.length;
      recommendPercent =
        (feedbackList.filter((f) => f.wouldRecommend).length / feedbackList.length) *
        100;
    }

    return res.status(200).json({
      success: true,
      count: feedbackList.length,
      summary: {
        totalSubmissions: feedbackList.length,
        totalResponses: feedbackList.length,
        averageRating: Number(avgOverall.toFixed(1)),
        avgOverall: Number(avgOverall.toFixed(1)),
        avgSpeaker: Number(avgSpeaker.toFixed(1)),
        avgContent: Number(avgContent.toFixed(1)),
        avgOrganization: Number(avgOrg.toFixed(1)),
        recommendationPercentage: Math.round(recommendPercent),
        recommendPercentage: Math.round(recommendPercent),
      },
      data: feedbackList,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event feedback.",
    });
  }
};

/**
 * Get Specific Feedback by ID
 * GET /api/feedback/:id
 * Access: Protected | Allowed Roles: student (own only), volunteer, admin
 */
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid feedback ID is required.",
      });
    }

    const feedback = await Feedback.findOne({ _id: id, isDeleted: false })
      .populate("studentId", "fullName name enrollmentNumber enrollmentNo department year")
      .populate("eventId", "name date eventDate venue category status");

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback record not found.",
      });
    }

    // RBAC: Student can view only their own feedback
    if (
      req.user.role === "student" &&
      feedback.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view another student's feedback.",
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch feedback record.",
    });
  }
};

export default {
  submitFeedback,
  getMyFeedback,
  getEventFeedback,
  getFeedbackById,
};
