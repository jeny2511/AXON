import mongoose from "mongoose";
import crypto from "crypto";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import StudentEventQR from "../models/StudentEventQR.js";
import User from "../models/User.js";

/**
 * Check Student Eligibility for an Event
 */
export function checkStudentEligibility(student, event) {
  if (!student || !event) {
    return { eligible: false, reason: "Invalid student or event data." };
  }

  // If eligibility restrictions are enabled on the event
  if (event.eligibility?.enabled) {
    // 1. Academic Year Check
    if (event.eligibility.years && event.eligibility.years.length > 0) {
      let studentYear = student.currentYear;
      if (!studentYear && student.year) {
        studentYear = typeof student.year === "string" ? parseInt(student.year, 10) : Number(student.year);
      }
      studentYear = Number(studentYear) || 1;

      const allowedYears = event.eligibility.years.map(Number);
      if (!allowedYears.includes(studentYear)) {
        return {
          eligible: false,
          reason: `Year ${studentYear} students are not eligible for this event. Eligible years: ${allowedYears.join(", ")}.`,
        };
      }
    }

    // 2. Department / Branch Check
    if (event.eligibility.branchCodes && event.eligibility.branchCodes.length > 0) {
      const studentDept = (student.department || student.branch || "").toUpperCase();
      const allowedCodes = event.eligibility.branchCodes.map((c) => c.toUpperCase());
      if (studentDept && !allowedCodes.includes(studentDept) && !allowedCodes.includes("ALL")) {
        return {
          eligible: false,
          reason: `Department ${studentDept} is not eligible for this event. Eligible departments: ${allowedCodes.join(", ")}.`,
        };
      }
    }
  }

  return { eligible: true };
}

/**
 * Register Student for an Event
 * POST /api/registrations
 * Access: Protected | Allowed Role: student
 */
export const registerForEvent = async (req, res) => {
  try {
    const student = req.user;

    // 1. Role enforcement
    if (student.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students are permitted to register for events.",
      });
    }

    const { eventId } = req.body;
    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    // 2. Find event
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or has been deleted.",
      });
    }

    // 3. Event lifecycle status check
    const allowedStatuses = ["published", "upcoming", "registration_open"];
    if (!allowedStatuses.includes(event.status)) {
      return res.status(400).json({
        success: false,
        message: `Registration is not allowed for an event with status '${event.status}'.`,
      });
    }

    // 4. Registration Window check
    const now = new Date();
    if (event.registration?.openAt && now < new Date(event.registration.openAt)) {
      return res.status(400).json({
        success: false,
        message: `Registration has not opened yet. Registration opens on ${new Date(event.registration.openAt).toLocaleString()}.`,
      });
    }

    if (event.registration?.closeAt && now > new Date(event.registration.closeAt)) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed. Registration is closed.",
      });
    }

    // 5. Eligibility check
    const eligibilityResult = checkStudentEligibility(student, event);
    if (!eligibilityResult.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibilityResult.reason,
      });
    }

    // 6. Duplicate active registration check
    const existingActiveReg = await Registration.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
      status: "registered",
    });

    if (existingActiveReg) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }

    // 7. Atomic Capacity Check & Increment
    // Conditionally increments registeredCount only if registeredCount < participantsLimit
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        isDeleted: false,
        $expr: { $lt: ["$registeredCount", "$participantsLimit"] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: "Event registration is full. Maximum participant capacity reached.",
      });
    }

    // 8. Create Registration Document
    const qrCodeString = `QR-${event._id.toString().slice(-6).toUpperCase()}-${student._id.toString().slice(-6).toUpperCase()}`;

    const registration = await Registration.create({
      studentId: student._id,
      eventId: event._id,
      registeredAt: now,
      status: "registered",
      qrCode: qrCodeString,
      isDeleted: false,
    });

    // 9. Generate Secure StudentEventQR Token
    const secureToken = crypto.randomBytes(24).toString("hex");
    const expiryDate = event.endDate
      ? new Date(new Date(event.endDate).getTime() + 48 * 60 * 60 * 1000)
      : new Date(new Date(event.date).getTime() + 48 * 60 * 60 * 1000);

    const qrDoc = await StudentEventQR.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: registration._id,
      token: secureToken,
      generatedAt: now,
      expiresAt: expiryDate,
      active: true,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful!",
      data: {
        _id: registration._id,
        id: registration._id.toString(),
        studentId: student._id,
        eventId: event._id,
        status: registration.status,
        registeredAt: registration.registeredAt,
        qrCode: registration.qrCode,
        qr: {
          token: qrDoc.token,
          expiresAt: qrDoc.expiresAt,
          active: qrDoc.active,
        },
        event: {
          id: updatedEvent._id,
          name: updatedEvent.name,
          registeredCount: updatedEvent.registeredCount,
          participantsLimit: updatedEvent.participantsLimit,
        },
      },
    });
  } catch (error) {
    // If a duplicate key error occurs on the unique index
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to complete registration.",
    });
  }
};

/**
 * Get Current Student's Registrations
 * GET /api/registrations/my
 * Access: Protected | Allowed Role: student
 */
export const getMyRegistrations = async (req, res) => {
  try {
    const studentId = req.user._id;

    const registrations = await Registration.find({
      studentId,
      isDeleted: false,
      status: "registered",
    })
      .sort({ registeredAt: -1 })
      .populate({
        path: "eventId",
        match: { isDeleted: false },
      });

    // Attach matching active QR token
    const regIds = registrations.map((r) => r._id);
    const qrTokens = await StudentEventQR.find({
      registrationId: { $in: regIds },
      active: true,
    });

    const qrMap = new Map();
    qrTokens.forEach((q) => qrMap.set(q.registrationId.toString(), q.token));

    const formatted = registrations
      .filter((r) => r.eventId) // filter out if event soft-deleted
      .map((r) => {
        const ev = r.eventId.toObject({ virtuals: true });
        const token = qrMap.get(r._id.toString()) || r.qrCode;

        return {
          _id: r._id,
          id: r._id.toString(),
          registrationId: r._id.toString(),
          registrationDate: r.registeredAt,
          registeredAt: r.registeredAt,
          status: r.status,
          qrCode: r.qrCode || token,
          qrToken: token,
          eventId: ev._id.toString(),
          event: {
            ...ev,
            id: ev._id.toString(),
            eventDate: ev.date ? new Date(ev.date).toISOString().split("T")[0] : "",
            speakerName: ev.speaker || "",
            participantLimit: ev.participantsLimit || 100,
          },
        };
      });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student registrations.",
    });
  }
};

/**
 * Cancel a Registration
 * DELETE /api/registrations/:id or PATCH /api/registrations/:id/cancel
 * Access: Protected | Allowed Roles: student (owner), volunteer, admin
 */
export const cancelRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Invalid registration ID format.",
      });
    }

    const registration = await Registration.findById(id);
    if (!registration || registration.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    // Ownership check: Student can only cancel their own registration
    if (req.user.role === "student" && registration.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel another student's registration.",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Registration is already cancelled.",
      });
    }

    // 1. Mark Registration as cancelled and soft-delete
    registration.status = "cancelled";
    registration.cancellationReason = reason || "Cancelled by user";
    registration.isDeleted = true;
    registration.deletedAt = new Date();
    registration.deletedBy = req.user._id;
    await registration.save();

    // 2. Atomically decrement Event.registeredCount
    await Event.findOneAndUpdate(
      { _id: registration.eventId, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } }
    );

    // 3. Deactivate StudentEventQR tokens
    await StudentEventQR.updateMany(
      { registrationId: registration._id },
      { active: false }
    );

    return res.status(200).json({
      success: true,
      message: "Registration cancelled successfully.",
      data: {
        registrationId: registration._id,
        status: "cancelled",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel registration.",
    });
  }
};

/**
 * Get Participants / Registrations for a specific Event
 * GET /api/registrations/event/:eventId
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(404).json({
        success: false,
        message: "Invalid event ID format.",
      });
    }

    const event = await Event.findById(eventId);
    if (!event || event.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const registrations = await Registration.find({
      eventId,
      isDeleted: false,
      status: "registered",
    })
      .sort({ registeredAt: 1 })
      .populate("studentId", "fullName email enrollmentNumber department year phoneNumber accountStatus");

    const participants = registrations.map((reg) => {
      const student = reg.studentId || {};
      return {
        _id: reg._id,
        id: reg._id.toString(),
        registrationId: reg._id.toString(),
        registeredAt: reg.registeredAt,
        status: reg.status,
        qrCode: reg.qrCode,
        studentId: student._id || student.id,
        student: {
          id: student._id ? student._id.toString() : "",
          fullName: student.fullName || "Student",
          name: student.fullName || "Student",
          email: student.email || "",
          enrollmentNo: student.enrollmentNumber || "",
          enrollmentNumber: student.enrollmentNumber || "",
          department: student.department || "",
          year: student.year || 1,
          phone: student.phoneNumber || "",
        },
      };
    });

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        registeredCount: event.registeredCount,
        participantsLimit: event.participantsLimit,
      },
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event participants.",
    });
  }
};

/**
 * Get All Registrations (Directory)
 * GET /api/registrations
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getAllRegistrations = async (req, res) => {
  try {
    const query = { isDeleted: false, status: "registered" };

    const registrations = await Registration.find(query)
      .sort({ registeredAt: -1 })
      .populate("studentId", "fullName email enrollmentNumber department year phoneNumber batch")
      .populate("eventId", "name date eventDate venue startTime endTime");

    const formatted = registrations.map((reg) => {
      const studentObj = reg.studentId
        ? typeof reg.studentId.toObject === "function"
          ? reg.studentId.toObject({ virtuals: true })
          : reg.studentId
        : null;
      const eventObj = reg.eventId
        ? typeof reg.eventId.toObject === "function"
          ? reg.eventId.toObject({ virtuals: true })
          : reg.eventId
        : null;

      const studentData = studentObj
        ? {
            _id: studentObj._id,
            id: studentObj._id?.toString(),
            name: studentObj.fullName || studentObj.name || "Student",
            fullName: studentObj.fullName || studentObj.name || "Student",
            email: studentObj.email || "",
            enrollmentNo: studentObj.enrollmentNumber || studentObj.enrollmentNo || "",
            enrollmentNumber: studentObj.enrollmentNumber || studentObj.enrollmentNo || "",
            department: studentObj.department || "",
            year: studentObj.year || (studentObj.currentYear ? `${studentObj.currentYear} Year` : ""),
            phoneNumber: studentObj.phoneNumber || "",
          }
        : null;

      const eventData = eventObj
        ? {
            _id: eventObj._id,
            id: eventObj._id?.toString(),
            name: eventObj.name || "",
            title: eventObj.name || "",
            eventDate: eventObj.eventDate || (eventObj.date ? new Date(eventObj.date).toISOString().split("T")[0] : ""),
            date: eventObj.date || "",
            venue: eventObj.venue || "",
            startTime: eventObj.startTime || "",
            endTime: eventObj.endTime || "",
          }
        : null;

      return {
        _id: reg._id,
        id: reg._id.toString(),
        registrationId: reg._id.toString(),
        registeredAt: reg.registeredAt,
        status: reg.status,
        qrCode: reg.qrCode,
        studentId: studentData,
        student: studentData,
        eventId: eventData,
        event: eventData,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch all registrations.",
    });
  }
};
