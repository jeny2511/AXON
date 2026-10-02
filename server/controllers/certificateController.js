import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import Attendance from "../models/Attendance.js";
import Feedback from "../models/Feedback.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

/**
 * Certificate Controller
 * Handles Public Certificate Verification, Student Certificate Access & Unlocking,
 * Bulk Certificate Issuance for Attended Participants, and Template Management.
 */

// =========================================================================
// 1. PUBLIC CERTIFICATE VERIFICATION (No Login Required)
// =========================================================================
export const verifyCertificate = async (req, res) => {
  try {
    const rawCode = req.params.code || req.query.code;

    if (!rawCode || !rawCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Certificate verification code is required.",
      });
    }

    const cleanCode = rawCode.trim().toUpperCase();

    // Query certificate by verification code or ID
    const query = {
      $or: [
        { verificationCode: cleanCode },
        { verificationCode: rawCode.trim() },
      ],
      isDeleted: false,
    };

    if (/^[0-9a-fA-F]{24}$/.test(rawCode.trim())) {
      query.$or.push({ _id: rawCode.trim() });
    }

    const cert = await Certificate.findOne(query)
      .populate("eventId", "name date endDate venue speaker description poster")
      .populate("studentId", "fullName enrollmentNumber department");

    if (!cert) {
      return res.status(404).json({
        success: false,
        isValid: false,
        message: "Certificate not found. This certificate code is invalid or has been revoked.",
      });
    }

    return res.status(200).json({
      success: true,
      isValid: true,
      message: "Certificate verified successfully!",
      certificate: {
        certificateId: cert._id,
        verificationCode: cert.verificationCode || cert._id,
        studentName: cert.studentName || cert.studentId?.fullName,
        enrollmentNumber: cert.enrollmentNumber || cert.studentId?.enrollmentNumber,
        department: cert.studentId?.department || "VGEC",
        eventName: cert.eventId?.name || "College Event",
        eventDate: cert.eventId?.date,
        venue: cert.eventId?.venue || "VGEC Campus",
        certificateTitle: cert.certificateTitle || "Certificate of Participation",
        issuedAt: cert.generatedAt || cert.createdAt,
        issuer: "The Cyber Force (TCF) • VGEC",
        status: "Verified Authentic",
      },
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] verifyCertificate Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify certificate.",
    });
  }
};

// =========================================================================
// 2. GET MY CERTIFICATES (Student - With Feedback Lock Status)
// =========================================================================
export const getMyCertificates = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Fetch all certificates belonging to this student
    const certificates = await Certificate.find({
      studentId,
      isDeleted: false,
    })
      .populate("eventId", "name date endDate venue poster category feedbackRequired")
      .sort({ createdAt: -1 });

    // 2. For each certificate, check if event required feedback and whether it is unlocked
    const formatted = await Promise.all(
      certificates.map(async (cert) => {
        const certObj = cert.toObject({ virtuals: true });
        const event = cert.eventId;

        let isLocked = false;
        let lockReason = "";

        if (event && event.feedbackRequired) {
          const feedback = await Feedback.findOne({
            studentId,
            eventId: event._id,
            isDeleted: false,
          });

          if (!feedback) {
            isLocked = true;
            lockReason = "Please submit event feedback to unlock and download this certificate.";
          }
        }

        return {
          id: cert._id,
          _id: cert._id,
          verificationCode: cert.verificationCode || cert._id,
          certificateTitle: cert.certificateTitle,
          studentName: cert.studentName,
          enrollmentNumber: cert.enrollmentNumber,
          pdfUrl: cert.pdfUrl,
          issuedAt: cert.generatedAt || cert.createdAt,
          event: event
            ? {
                id: event._id,
                name: event.name,
                date: event.date,
                venue: event.venue,
                category: event.category,
                poster: event.poster,
              }
            : null,
          isLocked,
          lockReason,
          status: isLocked ? "locked" : "unlocked",
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: formatted.length,
      certificates: formatted,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] getMyCertificates Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student certificates.",
    });
  }
};

// =========================================================================
// 3. GET CERTIFICATE BY ID / DOWNLOAD METADATA
// =========================================================================
export const getCertificateById = async (req, res) => {
  try {
    const { id } = req.params;

    const cert = await Certificate.findOne({ _id: id, isDeleted: false })
      .populate("eventId", "name date endDate venue speaker category feedbackRequired")
      .populate("studentId", "fullName enrollmentNumber email department");

    if (!cert) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    // If student requesting, check lock status
    if (req.user && req.user.role === "student" && cert.studentId._id.toString() === req.user._id.toString()) {
      if (cert.eventId && cert.eventId.feedbackRequired) {
        const feedback = await Feedback.findOne({
          studentId: req.user._id,
          eventId: cert.eventId._id,
          isDeleted: false,
        });

        if (!feedback) {
          return res.status(403).json({
            success: false,
            isLocked: true,
            message: "Certificate is locked. Please submit event feedback to unlock it.",
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      certificate: cert,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] getCertificateById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve certificate details.",
    });
  }
};

// =========================================================================
// 4. BULK ISSUE CERTIFICATES FOR EVENT (Admin & Volunteer)
// =========================================================================
export const issueCertificatesForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // 1. Fetch all students who physically ATTENDED this event
    const attendances = await Attendance.find({
      eventId: event._id,
      status: "present",
      isDeleted: false,
    }).populate("studentId", "fullName enrollmentNumber email");

    if (attendances.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No students have attended this event yet. Cannot issue certificates.",
      });
    }

    let newlyIssuedCount = 0;
    let alreadyIssuedCount = 0;

    for (const att of attendances) {
      const student = att.studentId;
      if (!student) continue;

      // Check if certificate already exists
      const existingCert = await Certificate.findOne({
        studentId: student._id,
        eventId: event._id,
        isDeleted: false,
      });

      if (existingCert) {
        alreadyIssuedCount++;
        continue;
      }

      // Generate unique verification code
      const eventCode = event._id.toString().slice(-4).toUpperCase();
      const studentCode = student._id.toString().slice(-4).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const verificationCode = `TCF-${eventCode}-${studentCode}-${randomPart}`;

      await Certificate.create({
        studentId: student._id,
        eventId: event._id,
        studentName: student.fullName,
        enrollmentNumber: student.enrollmentNumber || "VGEC",
        certificateTitle: `Certificate of Participation - ${event.name}`,
        verificationCode,
        status: "available",
        sentAutomatically: true,
        generatedAt: new Date(),
      });

      newlyIssuedCount++;

      // In-app notification
      try {
        await Notification.create({
          recipient: student._id,
          recipientRole: "student",
          title: "Certificate Issued!",
          message: `Your certificate for '${event.name}' has been generated. ${event.feedbackRequired ? "Submit feedback to unlock." : "Ready for download."}`,
          type: "certificate",
          referenceId: event._id,
          referenceModel: "Event",
        });
      } catch {
        // non-blocking
      }
    }

    return res.status(200).json({
      success: true,
      message: `Issued ${newlyIssuedCount} new certificate(s) for event '${event.name}'. (${alreadyIssuedCount} were already issued).`,
      newlyIssuedCount,
      alreadyIssuedCount,
      totalEligible: attendances.length,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] issueCertificatesForEvent Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to issue certificates for event.",
    });
  }
};

// =========================================================================
// 5. GET EVENT CERTIFICATES LIST (Volunteer & Admin)
// =========================================================================
export const getEventCertificates = async (req, res) => {
  try {
    const { eventId } = req.params;

    const certificates = await Certificate.find({
      eventId,
      isDeleted: false,
    })
      .populate("studentId", "fullName enrollmentNumber department email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: certificates.length,
      certificates,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] getEventCertificates Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event certificates.",
    });
  }
};

// =========================================================================
// 6. CERTIFICATE TEMPLATE MANAGEMENT (Admin)
// =========================================================================
export const getTemplate = async (req, res) => {
  try {
    let template = await CertificateTemplate.findOne({ isActive: true });
    if (!template) {
      template = {
        name: "Standard TCF Certificate Template",
        templateFile: "/assets/certificates/default-template.pdf",
        placeholders: ["studentName", "enrollmentNumber", "eventName", "date"],
        isActive: true,
      };
    }

    return res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] getTemplate Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve certificate template.",
    });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { name, templateFile, placeholders } = req.body;

    let template = await CertificateTemplate.findOne({ isActive: true });

    if (template) {
      if (name) template.name = name.trim();
      if (templateFile) template.templateFile = templateFile.trim();
      if (Array.isArray(placeholders)) template.placeholders = placeholders;
      template.updatedBy = req.user._id;
      await template.save();
    } else {
      template = await CertificateTemplate.create({
        name: name || "Standard TCF Certificate Template",
        templateFile: templateFile || "/assets/certificates/default-template.pdf",
        placeholders: placeholders || ["studentName", "enrollmentNumber"],
        updatedBy: req.user._id,
        isActive: true,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Certificate template updated successfully.",
      template,
    });
  } catch (error) {
    console.error("❌ [Certificate Controller] updateTemplate Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update certificate template.",
    });
  }
};

export default {
  verifyCertificate,
  getMyCertificates,
  getCertificateById,
  issueCertificatesForEvent,
  getEventCertificates,
  getTemplate,
  updateTemplate,
};
