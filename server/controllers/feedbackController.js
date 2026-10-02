import Feedback from "../models/Feedback.js";
import FeedbackForm from "../models/FeedbackForm.js";
import Attendance from "../models/Attendance.js";
import Event from "../models/Event.js";
import Certificate from "../models/Certificate.js";
import Notification from "../models/Notification.js";

/**
 * Feedback Controller
 * Handles Feedback Form Configuration, Student Submissions (with strict Attendance check),
 * Automatic Certificate Unlocking, and Aggregated Event Feedback Analytics.
 */

// =========================================================================
// 1. GET FEEDBACK FORM FOR EVENT
// =========================================================================
export const getFeedbackForm = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Check if custom form exists for this event
    let form = await FeedbackForm.findOne({ eventId, isDeleted: false, isActive: true });

    // If no custom form created yet, provide the standard default form
    if (!form) {
      form = {
        eventId: event._id,
        title: `${event.name} - Feedback Form`,
        questions: [
          { question: "Overall Event Experience", type: "rating", scale: 5, required: true },
          { question: "Speaker Knowledge & Presentation", type: "rating", scale: 5, required: true },
          { question: "Event Organization & Coordination", type: "rating", scale: 5, required: true },
          { question: "Content Relevance & Quality", type: "rating", scale: 5, required: true },
          { question: "Would you recommend future events by TCF?", type: "boolean", required: true },
          { question: "Any suggestions or improvements for future events?", type: "textarea", required: false },
        ],
        isDefaultTemplate: true,
      };
    }

    // If student is requesting, check their attendance and submission status
    let hasAttended = false;
    let hasSubmitted = false;

    if (req.user && req.user.role === "student") {
      const attendance = await Attendance.findOne({
        studentId: req.user._id,
        eventId: event._id,
        status: "present",
        isDeleted: false,
      });
      hasAttended = Boolean(attendance);

      const existingFeedback = await Feedback.findOne({
        studentId: req.user._id,
        eventId: event._id,
        isDeleted: false,
      });
      hasSubmitted = Boolean(existingFeedback);
    }

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        speaker: event.speaker,
      },
      form,
      hasAttended,
      hasSubmitted,
      canSubmit: hasAttended && !hasSubmitted,
    });
  } catch (error) {
    console.error("❌ [Feedback Controller] getFeedbackForm Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve feedback form.",
    });
  }
};

// =========================================================================
// 2. CREATE OR UPDATE FEEDBACK FORM (Volunteer & Admin)
// =========================================================================
export const createOrUpdateFeedbackForm = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, questions, isActive } = req.body;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    let form = await FeedbackForm.findOne({ eventId });

    if (form) {
      if (title) form.title = title.trim();
      if (Array.isArray(questions)) form.questions = questions;
      if (isActive !== undefined) form.isActive = isActive;
      form.createdBy = req.user._id;
      await form.save();
    } else {
      form = await FeedbackForm.create({
        eventId: event._id,
        title: title || `${event.name} - Feedback Form`,
        questions: Array.isArray(questions) ? questions : [],
        createdBy: req.user._id,
        isActive: isActive !== undefined ? isActive : true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback form saved successfully.",
      form,
    });
  } catch (error) {
    console.error("❌ [Feedback Controller] createOrUpdateFeedbackForm Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save feedback form.",
    });
  }
};

// =========================================================================
// 3. SUBMIT FEEDBACK (Student - Requires Attendance)
// =========================================================================
export const submitFeedback = async (req, res) => {
  try {
    const { eventId } = req.params;
    const student = req.user;
    const {
      overallRating,
      speakerRating,
      organizationRating,
      contentRating,
      wouldRecommend,
      comment,
      isAnonymous,
    } = req.body;

    // 1. Verify Event
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // 2. Strict Attendance Rule: Student MUST have attended the event to submit feedback
    const attendance = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      status: "present",
      isDeleted: false,
    });

    if (!attendance) {
      return res.status(403).json({
        success: false,
        message: "You can only submit feedback for events you have physically attended.",
      });
    }

    // 3. Check duplicate submission
    const existingFeedback = await Feedback.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted feedback for this event. Feedback cannot be edited.",
      });
    }

    // 4. Validate Rating Score (1 to 5)
    const rating = Number(overallRating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Overall rating is required and must be between 1 and 5 stars.",
      });
    }

    // 5. Create Feedback Record
    const feedback = await Feedback.create({
      eventId: event._id,
      studentId: student._id,
      overallRating: rating,
      speakerRating: speakerRating ? Number(speakerRating) : rating,
      organizationRating: organizationRating ? Number(organizationRating) : rating,
      contentRating: contentRating ? Number(contentRating) : rating,
      wouldRecommend: wouldRecommend !== undefined ? Boolean(wouldRecommend) : true,
      comment: (comment || "").trim(),
      isAnonymous: Boolean(isAnonymous),
      editable: false,
      submittedAt: new Date(),
    });

    // 6. Automatically unlock/generate certificate if event offers certificates
    let certificateUnlocked = false;
    let certificateRecord = null;
    if (event.certificateAvailable) {
      const existingCert = await Certificate.findOne({
        studentId: student._id,
        eventId: event._id,
        isDeleted: false,
      });

      if (!existingCert) {
        const certCode = `CERT-${event._id.toString().slice(-4).toUpperCase()}-${student._id.toString().slice(-4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        certificateRecord = await Certificate.create({
          studentId: student._id,
          eventId: event._id,
          certificateCode: certCode,
          studentName: student.fullName,
          eventName: event.name,
          issuedAt: new Date(),
          status: "issued",
        });
        certificateUnlocked = true;
      } else {
        certificateRecord = existingCert;
        certificateUnlocked = true;
      }
    }

    // 7. Notification for Student
    try {
      await Notification.create({
        recipient: student._id,
        recipientRole: "student",
        title: "Feedback Submitted",
        message: `Thank you for sharing your feedback for '${event.name}'! ${certificateUnlocked ? "Your certificate is now ready for download." : ""}`,
        type: "feedback",
        referenceId: event._id,
        referenceModel: "Event",
      });
    } catch {
      // non-blocking
    }

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! Thank you for your review.",
      feedback,
      certificateUnlocked,
      certificate: certificateRecord,
    });
  } catch (error) {
    console.error("❌ [Feedback Controller] submitFeedback Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit feedback.",
    });
  }
};

// =========================================================================
// 4. GET FEEDBACK ANALYTICS (Volunteer & Admin)
// =========================================================================
export const getEventFeedbackAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const feedbacks = await Feedback.find({ eventId: event._id, isDeleted: false })
      .populate("studentId", "fullName department")
      .sort({ submittedAt: -1 });

    const totalSubmissions = feedbacks.length;

    if (totalSubmissions === 0) {
      return res.status(200).json({
        success: true,
        event: { id: event._id, name: event.name },
        totalSubmissions: 0,
        averages: {
          overall: 0,
          speaker: 0,
          organization: 0,
          content: 0,
        },
        recommendationRate: "0%",
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        comments: [],
      });
    }

    // Calculate Averages and Distribution
    let sumOverall = 0;
    let sumSpeaker = 0;
    let sumOrg = 0;
    let sumContent = 0;
    let recommendCount = 0;
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const comments = [];

    feedbacks.forEach((f) => {
      sumOverall += f.overallRating || 0;
      sumSpeaker += f.speakerRating || f.overallRating || 0;
      sumOrg += f.organizationRating || f.overallRating || 0;
      sumContent += f.contentRating || f.overallRating || 0;

      if (f.wouldRecommend) recommendCount++;

      const roundedRating = Math.round(f.overallRating);
      if (distribution[roundedRating] !== undefined) {
        distribution[roundedRating]++;
      }

      if (f.comment && f.comment.trim()) {
        comments.push({
          rating: f.overallRating,
          comment: f.comment,
          submittedAt: f.submittedAt,
          author: f.isAnonymous ? "Anonymous Student" : f.studentId?.fullName || "Student",
          department: f.isAnonymous ? "Undisclosed" : f.studentId?.department || "",
        });
      }
    });

    const avgOverall = (sumOverall / totalSubmissions).toFixed(1);
    const avgSpeaker = (sumSpeaker / totalSubmissions).toFixed(1);
    const avgOrg = (sumOrg / totalSubmissions).toFixed(1);
    const avgContent = (sumContent / totalSubmissions).toFixed(1);
    const recRate = Math.round((recommendCount / totalSubmissions) * 100);

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        speaker: event.speaker,
      },
      totalSubmissions,
      averages: {
        overall: Number(avgOverall),
        speaker: Number(avgSpeaker),
        organization: Number(avgOrg),
        content: Number(avgContent),
      },
      recommendationRate: `${recRate}%`,
      distribution,
      comments,
    });
  } catch (error) {
    console.error("❌ [Feedback Controller] getEventFeedbackAnalytics Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve feedback analytics.",
    });
  }
};

// =========================================================================
// 5. GET MY FEEDBACK SUBMISSIONS (Student)
// =========================================================================
export const getMyFeedback = async (req, res) => {
  try {
    const studentId = req.user._id;

    const feedbacks = await Feedback.find({ studentId, isDeleted: false })
      .populate("eventId", "name date venue poster category")
      .sort({ submittedAt: -1 });

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    console.error("❌ [Feedback Controller] getMyFeedback Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch your feedback submissions.",
    });
  }
};

export default {
  getFeedbackForm,
  createOrUpdateFeedbackForm,
  submitFeedback,
  getEventFeedbackAnalytics,
  getMyFeedback,
};
