import mongoose from "mongoose";
import crypto from "crypto";
import Certificate from "../models/Certificate.js";
import Attendance from "../models/Attendance.js";
import Registration from "../models/Registration.js";
import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

/**
 * Check Student Certificate Eligibility for an Event
 * Evaluates: Registration -> Attendance -> Feedback (if required) -> Event Settings
 */
export async function evaluateCertificateEligibility(studentId, eventId) {
  const event = await Event.findOne({ _id: eventId, isDeleted: false });
  if (!event) {
    return {
      eligible: false,
      reason: "Event not found or has been deleted.",
      criteria: {
        eventFound: false,
        certificateAvailable: false,
        hasRegistration: false,
        hasAttendance: false,
        hasSubmittedFeedback: false,
      },
    };
  }

  const certificateAvailable = event.certificateAvailable !== false;
  const registration = await Registration.findOne({
    studentId,
    eventId,
    isDeleted: false,
    status: "registered",
  });
  const attendance = await Attendance.findOne({
    studentId,
    eventId,
    isDeleted: false,
    status: "present",
  });

  let feedback = null;
  if (event.feedbackRequired) {
    feedback = await Feedback.findOne({
      studentId,
      eventId,
      isDeleted: false,
    });
  }

  const criteria = {
    eventFound: true,
    certificateAvailable,
    hasRegistration: Boolean(registration),
    hasAttendance: Boolean(attendance),
    hasSubmittedFeedback: event.feedbackRequired ? Boolean(feedback) : true,
  };

  // 1. Check Event Certificate Settings
  if (!certificateAvailable) {
    return {
      eligible: false,
      reason: "Certificates are not enabled or available for this event.",
      criteria,
      event,
    };
  }

  // 2. Check Student Active Registration
  if (!registration) {
    return {
      eligible: false,
      reason: "Student is not actively registered for this event.",
      criteria,
      event,
    };
  }

  // 3. Check Verified Attendance
  if (!attendance) {
    return {
      eligible: false,
      reason: "Attendance has not been marked or verified as Present for this event.",
      criteria,
      event,
    };
  }

  // 4. Check Feedback requirement
  if (event.feedbackRequired && !feedback) {
    return {
      eligible: false,
      reason: "Feedback is required for this event before certificate issuance.",
      criteria,
      event,
    };
  }

  return { eligible: true, criteria, event };
}

/**
 * Generate Certificates for an Event
 * POST /api/certificates/generate/:eventId
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const generateEventCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

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
        message: "Event not found or has been deleted.",
      });
    }

    if (event.certificateAvailable === false) {
      return res.status(400).json({
        success: false,
        message: "Certificates are not enabled or available for this event.",
      });
    }

    // Find all registered students for the event
    const registrations = await Registration.find({
      eventId,
      isDeleted: false,
      status: "registered",
    }).populate("studentId", "fullName name enrollmentNumber enrollmentNo email department year");

    let generatedCount = 0;
    let skippedCount = 0;
    const generatedCertificates = [];

    for (const reg of registrations) {
      const student = reg.studentId;
      if (!student) {
        skippedCount++;
        continue;
      }

      // Check attendance
      const attendance = await Attendance.findOne({
        eventId: event._id,
        studentId: student._id,
        isDeleted: false,
        status: "present",
      });

      if (!attendance) {
        skippedCount++;
        continue;
      }

      // Check feedback requirement if enabled
      if (event.feedbackRequired) {
        const fb = await Feedback.findOne({
          studentId: student._id,
          eventId: event._id,
          isDeleted: false,
        });
        if (!fb) {
          skippedCount++;
          continue; // Skip student until feedback is submitted
        }
      }

      // Check if certificate already exists
      const existingCert = await Certificate.findOne({
        studentId: student._id,
        eventId: event._id,
        isDeleted: false,
      });

      if (existingCert) {
        skippedCount++;
        continue;
      }

      // Generate unique verification code & virtual PDF URL
      const studentCode = (student.enrollmentNumber || student.enrollmentNo || student._id.toString()).slice(-4).toUpperCase();
      const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
      const verificationCode = `AXON-CERT-${event._id.toString().slice(-4).toUpperCase()}-${studentCode}-${randomSuffix}`;
      const pdfUrl = `/certificates/generated/${event._id}_${student._id}.pdf`;

      const newCert = await Certificate.create({
        studentId: student._id,
        eventId: event._id,
        registrationId: reg._id,
        studentName: student.fullName || student.name || "Student",
        enrollmentNumber: student.enrollmentNumber || student.enrollmentNo || "N/A",
        certificateTitle: `${event.name} — Certificate of Participation`,
        pdfUrl,
        verificationCode,
        status: "issued",
        sentAutomatically: true,
        generatedAt: new Date(),
      });

      generatedCertificates.push(newCert);
      generatedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Certificates processed successfully! ${generatedCount} generated, ${skippedCount} existing/skipped.`,
      generatedCount,
      skippedCount,
      totalProcessed: registrations.length,
      data: {
        generatedCount,
        skippedCount,
        totalProcessed: registrations.length,
        certificates: generatedCertificates,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate event certificates.",
    });
  }
};

/**
 * Get Authenticated Student's Earned Certificates
 * GET /api/certificates/my
 * Access: Protected | Allowed Roles: student
 */
export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({
      studentId: req.user._id,
      isDeleted: false,
    })
      .populate("eventId", "name date eventDate venue category status poster")
      .sort({ generatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student certificates.",
    });
  }
};

/**
 * Get Certificates for a Specific Event
 * GET /api/certificates/event/:eventId
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getEventCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const certs = await Certificate.find({
      eventId,
      isDeleted: false,
    })
      .populate("studentId", "fullName name enrollmentNumber enrollmentNo email department year")
      .sort({ generatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: certs.length,
      data: certs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event certificates.",
    });
  }
};

/**
 * Check Eligibility for Current Student
 * GET /api/certificates/eligibility/:eventId
 * Access: Protected | Allowed Roles: student
 */
export const checkEligibility = async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user._id;

    const evalResult = await evaluateCertificateEligibility(studentId, eventId);
    const existingCert = await Certificate.findOne({
      studentId,
      eventId,
      isDeleted: false,
    });

    return res.status(200).json({
      success: true,
      eligible: evalResult.eligible,
      reason: evalResult.reason || "",
      criteria: evalResult.criteria,
      data: {
        eligible: evalResult.eligible,
        reason: evalResult.reason || "",
        criteria: evalResult.criteria,
        certificate: existingCert || null,
      },
      certificate: existingCert || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check certificate eligibility.",
    });
  }
};

/**
 * Get Specific Certificate by ID
 * GET /api/certificates/:id
 * Access: Protected | Allowed Roles: student (own only), volunteer, admin
 */
export const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid certificate ID is required.",
      });
    }

    const cert = await Certificate.findOne({ _id: id, isDeleted: false })
      .populate("studentId", "fullName name enrollmentNumber enrollmentNo email department year")
      .populate("eventId", "name date eventDate venue category status");

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate record not found.",
      });
    }

    // RBAC: Student can view only their own certificate
    if (
      req.user.role === "student" &&
      cert.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view another student's certificate.",
      });
    }

    return res.status(200).json({
      success: true,
      data: cert,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch certificate record.",
    });
  }
};

/**
 * Verify Certificate by Verification Code
 * GET /api/certificates/verify/:code
 * Access: Public / Authenticated
 */
export const verifyCertificate = async (req, res) => {
  try {
    const { code } = req.params;

    if (!code || typeof code !== "string") {
      return res.status(400).json({
        success: false,
        message: "A certificate verification code is required.",
      });
    }

    const cert = await Certificate.findOne({
      verificationCode: code.trim().toUpperCase(),
      isDeleted: false,
    })
      .populate("studentId", "fullName name enrollmentNumber enrollmentNo department year")
      .populate("eventId", "name date eventDate venue category status");

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unrecognized certificate verification code.",
      });
    }

    return res.status(200).json({
      success: true,
      valid: true,
      verified: true,
      message: "Certificate is authentic and valid.",
      data: {
        certificateId: cert._id,
        studentName: cert.studentName,
        enrollmentNumber: cert.enrollmentNumber,
        eventName: cert.eventId?.name || "TCF Event",
        eventDate: cert.eventId?.eventDate || cert.eventId?.date,
        issuedAt: cert.generatedAt,
        status: cert.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify certificate.",
    });
  }
};

export default {
  generateEventCertificates,
  getMyCertificates,
  getEventCertificates,
  checkEligibility,
  getCertificateById,
  verifyCertificate,
};
