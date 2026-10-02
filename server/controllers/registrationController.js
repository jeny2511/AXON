import crypto from "crypto";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import StudentEventQR from "../models/StudentEventQR.js";
import Attendance from "../models/Attendance.js";
import Notification from "../models/Notification.js";

/**
 * Registration Controller
 * Handles student event registration, QR pass generation, registration cancellation, and participant listing.
 */

// =========================================================================
// 1. REGISTER FOR EVENT (Student)
// =========================================================================
export const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const student = req.user;

    // 1. Verify Event existence
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or has been removed.",
      });
    }

    // 2. Check event status
    if (["cancelled", "draft", "completed"].includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot register for this event because it is currently ${event.status}.`,
      });
    }

    // 3. Check registration deadline
    const now = new Date();
    const closeTime = new Date(event.registration.closeAt);
    if (now > closeTime) {
      return res.status(400).json({
        success: false,
        message: "Registration for this event has closed.",
      });
    }

    // 4. Check capacity limit (Strict: No waiting list!)
    const currentCount = await Registration.countDocuments({
      eventId: event._id,
      status: "registered",
      isDeleted: false,
    });

    if (currentCount >= event.participantsLimit) {
      return res.status(400).json({
        success: false,
        message: `Registration is full. Capacity of ${event.participantsLimit} participants has been reached.`,
      });
    }

    // 5. Check duplicate registration
    const existingReg = await Registration.findOne({
      studentId: student._id,
      eventId: event._id,
      status: "registered",
      isDeleted: false,
    });

    if (existingReg) {
      return res.status(409).json({
        success: false,
        message: "You are already registered for this event.",
        registration: existingReg,
      });
    }

    // 6. Check Eligibility (Department & Academic Year)
    if (event.eligibility && event.eligibility.enabled) {
      const allowedDepts = event.eligibility.branchCodes || [];
      const allowedYears = event.eligibility.years || [];

      if (allowedDepts.length > 0 && student.department) {
        if (!allowedDepts.includes(student.department.toUpperCase())) {
          return res.status(403).json({
            success: false,
            message: `This event is restricted to [${allowedDepts.join(", ")}] department(s). Your department is ${student.department}.`,
          });
        }
      }

      if (allowedYears.length > 0 && student.currentYear) {
        if (!allowedYears.includes(Number(student.currentYear))) {
          return res.status(403).json({
            success: false,
            message: `This event is restricted to Year(s) [${allowedYears.join(", ")}]. You are in Year ${student.currentYear}.`,
          });
        }
      }
    }

    // 7. Generate Secure Cryptographic QR Pass Token
    const randomHex = crypto.randomBytes(6).toString("hex").toUpperCase();
    const eventSuffix = event._id.toString().slice(-4).toUpperCase();
    const studentSuffix = student._id.toString().slice(-4).toUpperCase();
    const qrPassToken = `AXON-EV${eventSuffix}-ST${studentSuffix}-${randomHex}`;

    // 8. Create Registration Document
    const registration = await Registration.create({
      studentId: student._id,
      eventId: event._id,
      status: "registered",
      qrCode: qrPassToken,
      registeredAt: new Date(),
    });

    // 9. Create Secure StudentEventQR Token Record
    const eventExpiryDate = new Date(event.endDate || event.date);
    // Allow pass validity until 23:59:59 of event day
    eventExpiryDate.setHours(23, 59, 59, 999);

    await StudentEventQR.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: registration._id,
      token: qrPassToken,
      expiresAt: eventExpiryDate,
      active: true,
    });

    // 10. Increment event registeredCount
    event.registeredCount = currentCount + 1;
    await event.save();

    // 11. Create In-App Notification for Student
    try {
      await Notification.create({
        recipient: student._id,
        recipientRole: "student",
        title: "Registration Confirmed!",
        message: `You have successfully registered for '${event.name}'. Your QR Pass is ready.`,
        type: "event",
        referenceId: event._id,
        referenceModel: "Event",
      });
    } catch {
      // Non-blocking notification
    }

    return res.status(201).json({
      success: true,
      message: `Successfully registered for '${event.name}'!`,
      registration: {
        id: registration._id,
        _id: registration._id,
        eventId: event._id,
        eventName: event.name,
        date: event.date,
        venue: event.venue,
        qrCode: qrPassToken,
        registeredAt: registration.registeredAt,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error("❌ [Registration Controller] registerForEvent Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete event registration.",
    });
  }
};

// =========================================================================
// 2. GET MY REGISTRATIONS (Student)
// =========================================================================
export const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user._id;

    const registrations = await Registration.find({
      studentId,
      isDeleted: false,
    })
      .populate({
        path: "eventId",
        select: "name date endDate startTime endTime venue poster category status participantsLimit registeredCount",
      })
      .sort({ registeredAt: -1 });

    // Format registrations and attach pass data
    const formatted = registrations.map((r) => {
      const regObj = r.toObject({ virtuals: true });
      return {
        ...regObj,
        event: regObj.eventId,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      registrations: formatted,
    });
  } catch (error) {
    console.error("❌ [Registration Controller] getMyRegistrations Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch registrations.",
    });
  }
};

// =========================================================================
// 3. CANCEL REGISTRATION (Student or Admin)
// =========================================================================
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const registration = await Registration.findOne({
      _id: id,
      isDeleted: false,
    }).populate("eventId");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration record not found.",
      });
    }

    // Permission check: only the student who registered or an Admin can cancel
    const isOwner = registration.studentId.toString() === req.user._id.toString();
    const isAdminUser = req.user.role === "admin";

    if (!isOwner && !isAdminUser) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this registration.",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This registration has already been cancelled.",
      });
    }

    // Check if event is already past/completed
    if (registration.eventId) {
      const now = new Date();
      if (registration.eventId.date < now) {
        return res.status(400).json({
          success: false,
          message: "Cannot cancel registration for an event that has already taken place.",
        });
      }
    }

    // Cancel registration
    registration.status = "cancelled";
    registration.cancellationReason = (reason || "Cancelled by participant").trim();
    await registration.save();

    // Deactivate associated QR Token
    await StudentEventQR.updateMany(
      { registrationId: registration._id },
      { active: false }
    );

    // Decrement event registeredCount
    if (registration.eventId) {
      await Event.findByIdAndUpdate(registration.eventId._id, {
        $inc: { registeredCount: -1 },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Registration has been cancelled successfully.",
    });
  } catch (error) {
    console.error("❌ [Registration Controller] cancelRegistration Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel registration.",
    });
  }
};

// =========================================================================
// 4. GET EVENT PARTICIPANTS (Admin & Volunteer)
// =========================================================================
export const getEventParticipants = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, status, attendanceStatus } = req.query;

    const query = {
      eventId,
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    } else {
      query.status = "registered";
    }

    const registrations = await Registration.find(query)
      .populate({
        path: "studentId",
        select: "fullName enrollmentNumber email department phoneNumber profilePhoto batch admissionType",
      })
      .sort({ registeredAt: -1 });

    // Fetch Attendance records for this event to cross-reference attendance status
    const attendances = await Attendance.find({
      eventId,
      isDeleted: false,
    }).select("studentId markedAt verificationMethod");

    const attendedStudentIds = new Set(
      attendances.map((a) => a.studentId.toString())
    );

    let participants = registrations
      .filter((r) => r.studentId) // ensure student exists
      .map((r) => {
        const student = r.studentId;
        const hasAttended = attendedStudentIds.has(student._id.toString());
        return {
          registrationId: r._id,
          studentId: student._id,
          fullName: student.fullName,
          name: student.fullName,
          enrollmentNumber: student.enrollmentNumber || "",
          enrollmentNo: student.enrollmentNumber || "",
          email: student.email,
          department: student.department || "",
          phone: student.phoneNumber || "",
          profilePhoto: student.profilePhoto || "",
          registeredAt: r.registeredAt,
          qrCode: r.qrCode,
          registrationStatus: r.status,
          attendanceStatus: hasAttended ? "present" : "absent",
          hasAttended,
        };
      });

    // Filter by search (name or enrollment number)
    if (search && search.trim()) {
      const kw = search.trim().toLowerCase();
      participants = participants.filter(
        (p) =>
          p.fullName.toLowerCase().includes(kw) ||
          p.enrollmentNumber.toLowerCase().includes(kw) ||
          p.email.toLowerCase().includes(kw)
      );
    }

    // Filter by attendance status
    if (attendanceStatus) {
      participants = participants.filter((p) => p.attendanceStatus === attendanceStatus.toLowerCase());
    }

    return res.status(200).json({
      success: true,
      count: participants.length,
      participants,
    });
  } catch (error) {
    console.error("❌ [Registration Controller] getEventParticipants Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event participants.",
    });
  }
};

// =========================================================================
// 5. GET REGISTRATION BY ID (With QR Pass Token)
// =========================================================================
export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findOne({
      _id: id,
      isDeleted: false,
    })
      .populate({
        path: "eventId",
        select: "name date endDate startTime endTime venue poster category status",
      })
      .populate({
        path: "studentId",
        select: "fullName enrollmentNumber email department",
      });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    return res.status(200).json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error("❌ [Registration Controller] getRegistrationById Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch registration details.",
    });
  }
};

export default {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  getRegistrationById,
};
