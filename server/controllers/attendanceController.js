import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import StudentEventQR from "../models/StudentEventQR.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

/**
 * Helper: Parse date and time string into Date object
 */
function parseDateTime(dateVal, timeStr) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return null;

  if (!timeStr || typeof timeStr !== "string") {
    return d;
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3] ? match[3].toUpperCase() : null;

    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    } else if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    d.setHours(hours, minutes, 0, 0);
    return d;
  }

  return d;
}

/**
 * Helper: Check if event attendance window is open
 */
function isEventAttendanceWindowOpen(event) {
  if (!event) return { open: false, reason: "Event not found." };
  if (event.isDeleted) return { open: false, reason: "Event has been deleted." };

  const now = new Date();

  // 1. Explicit attendance window
  let openTime = event.attendance?.openAt
    ? new Date(event.attendance.openAt)
    : event.attendanceOpenDate
    ? new Date(event.attendanceOpenDate)
    : null;

  let closeTime = event.attendance?.closeAt
    ? new Date(event.attendance.closeAt)
    : event.attendanceCloseDate
    ? new Date(event.attendanceCloseDate)
    : null;

  // 2. Fallback to event date & start/end times
  const baseDate = event.date || event.eventDate;
  if ((!openTime || isNaN(openTime.getTime())) && baseDate) {
    openTime = parseDateTime(baseDate, event.startTime);
  }
  if ((!closeTime || isNaN(closeTime.getTime())) && (event.endDate || baseDate)) {
    closeTime = parseDateTime(event.endDate || baseDate, event.endTime);
  }

  // Check before window
  if (openTime && !isNaN(openTime.getTime()) && now < openTime) {
    return {
      open: false,
      reason: `Attendance window has not opened yet. Opens on ${openTime.toLocaleString()}.`,
    };
  }

  // Check after window
  if (closeTime && !isNaN(closeTime.getTime()) && now > closeTime) {
    return {
      open: false,
      reason: `Attendance window has closed on ${closeTime.toLocaleString()}.`,
    };
  }

  // Check event status
  const allowedStatuses = ["published", "upcoming", "ongoing", "registration_open", "registration_closed", "completed"];
  if (event.status && !allowedStatuses.includes(event.status)) {
    return {
      open: false,
      reason: `Attendance is not permitted for an event with status '${event.status}'.`,
    };
  }

  return { open: true };
}

/**
 * Scan QR Code & Mark Attendance
 * POST /api/attendance/scan
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const scanQRAttendance = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "A valid QR token string is required.",
      });
    }

    const trimmedToken = token.trim();

    // 1. Locate the StudentEventQR
    let qrDoc = await StudentEventQR.findOne({ token: trimmedToken });
    if (!qrDoc) {
      const reg = await Registration.findOne({ qrCode: trimmedToken, isDeleted: false });
      if (reg) {
        qrDoc = await StudentEventQR.findOne({ registrationId: reg._id });
      }
    }

    console.log(`[QR DEBUG] Received token length: ${trimmedToken.length}`);
    console.log(`[QR DEBUG] Received token: ${trimmedToken}`);
    console.log(`[QR DEBUG] QR found: ${Boolean(qrDoc)}`);
    if (qrDoc) {
      console.log(`[QR DEBUG] QR eventId: ${qrDoc.eventId}`);
      console.log(`[QR DEBUG] QR registrationId: ${qrDoc.registrationId}`);
    } else {
      console.log(`[QR DEBUG] No StudentEventQR matched token`);
    }

    if (!qrDoc) {
      return res.status(404).json({
        success: false,
        message: "Invalid or unrecognized QR token.",
      });
    }

    // 2. Check if QR is active
    if (!qrDoc.active) {
      return res.status(400).json({
        success: false,
        message: "This QR token is inactive or has been revoked.",
      });
    }

    // 3. Check if QR has expired
    const now = new Date();
    if (qrDoc.expiresAt && now > new Date(qrDoc.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "This QR token has expired.",
      });
    }

    // 4. Load & verify linked registration
    const registration = await Registration.findOne({
      _id: qrDoc.registrationId,
      isDeleted: false,
      status: "registered",
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "The registration linked to this QR code is cancelled or not found.",
      });
    }

    // 5. Load & verify linked event
    const event = await Event.findOne({ _id: qrDoc.eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "The event associated with this QR code does not exist or has been deleted.",
      });
    }

    // 5b. Prevent Cross-Event QR Abuse (Requirement 7)
    if (req.body.eventId && qrDoc.eventId.toString() !== req.body.eventId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cross-event QR rejection: This QR code belongs to a different event.",
      });
    }

    // 6. Check event attendance window
    const windowCheck = isEventAttendanceWindowOpen(event);
    if (!windowCheck.open) {
      return res.status(400).json({
        success: false,
        message: windowCheck.reason,
      });
    }

    // 7. Load & verify student
    const student = await User.findOne({
      _id: qrDoc.studentId,
      isDeleted: false,
      accountStatus: "active",
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student account not found or is currently inactive.",
      });
    }

    // 8. Check for duplicate attendance (Requirement 8)
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        duplicate: true,
        message: `Student ${student.fullName || student.name || "Student"} is already marked Present.`,
        data: {
          attendance: existingAttendance,
          student: {
            id: student._id,
            name: student.fullName || student.name,
            enrollmentNo: student.enrollmentNumber || student.enrollmentNo,
            department: student.department,
          },
          event: {
            id: event._id,
            name: event.name,
          },
        },
      });
    }

    // 9. Create Attendance Record
    const attendance = await Attendance.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: registration._id,
      attendanceTime: now,
      markedBy: req.user._id,
      method: "qr",
      status: "present",
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: `Attendance marked successfully for ${student.fullName || student.name || "Student"}!`,
      data: {
        attendance,
        student: {
          id: student._id,
          name: student.fullName || student.name,
          enrollmentNo: student.enrollmentNumber || student.enrollmentNo,
          department: student.department,
        },
        event: {
          id: event._id,
          name: event.name,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Attendance has already been recorded for this student.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark attendance via QR scan.",
    });
  }
};

/**
 * Manually Mark Student Attendance
 * POST /api/attendance/manual
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const markManualAttendance = async (req, res) => {
  try {
    const { studentId, enrollmentNo, eventId } = req.body;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    // 1. Locate student by ID or enrollment number
    let student = null;
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await User.findOne({ _id: studentId, isDeleted: false, accountStatus: "active" });
    } else if (enrollmentNo) {
      const trimmedEnroll = enrollmentNo.trim().toUpperCase();
      student = await User.findOne({
        enrollmentNumber: trimmedEnroll,
        isDeleted: false,
        accountStatus: "active",
      });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Active student not found.",
      });
    }

    // 2. Load & verify event
    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found or has been deleted.",
      });
    }

    // 3. Check event attendance window
    const windowCheck = isEventAttendanceWindowOpen(event);
    if (!windowCheck.open) {
      return res.status(400).json({
        success: false,
        message: windowCheck.reason,
      });
    }

    // 4. Verify student has an active registration for this event
    const registration = await Registration.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
      status: "registered",
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: `Student (${student.enrollmentNumber || student.enrollmentNo || student.name}) is not actively registered for this event.`,
      });
    }

    // 5. Check for duplicate attendance
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        duplicate: true,
        message: `Student ${student.fullName || student.name || "Student"} is already marked Present.`,
        data: {
          attendance: existingAttendance,
          student: {
            id: student._id,
            name: student.fullName || student.name,
            enrollmentNo: student.enrollmentNumber || student.enrollmentNo,
            department: student.department,
          },
          event: {
            id: event._id,
            name: event.name,
          },
        },
      });
    }

    // 6. Create Attendance Record
    const now = new Date();
    const attendance = await Attendance.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: registration._id,
      attendanceTime: now,
      markedBy: req.user._id,
      method: "manual",
      status: "present",
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: `Manual attendance marked successfully for ${student.fullName || student.name || "Student"}!`,
      data: {
        attendance,
        student: {
          id: student._id,
          name: student.fullName || student.name,
          enrollmentNo: student.enrollmentNumber || student.enrollmentNo,
          department: student.department,
        },
        event: {
          id: event._id,
          name: event.name,
        },
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Attendance has already been recorded for this student.",
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark manual attendance.",
    });
  }
};

/**
 * Get Authenticated Student's Attendance Records
 * GET /api/attendance/my
 * Access: Protected | Allowed Roles: student
 */
export const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({
      studentId: req.user._id,
      isDeleted: false,
    })
      .populate("eventId", "name date eventDate startTime endTime venue status category poster")
      .populate("markedBy", "fullName name role")
      .sort({ attendanceTime: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch student attendance records.",
    });
  }
};

/**
 * Get Attendance Records for a Specific Event
 * GET /api/attendance/event/:eventId
 * Access: Protected | Allowed Roles: volunteer, admin
 */
export const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({
        success: false,
        message: "A valid event ID is required.",
      });
    }

    const records = await Attendance.find({
      eventId,
      isDeleted: false,
    })
      .populate("studentId", "fullName name email enrollmentNumber enrollmentNo department year batch phone phoneNumber")
      .populate("markedBy", "fullName name role")
      .sort({ attendanceTime: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch event attendance records.",
    });
  }
};

/**
 * Get Specific Attendance Record by ID
 * GET /api/attendance/:id
 * Access: Protected | Allowed Roles: student, volunteer, admin
 */
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid attendance ID is required.",
      });
    }

    const record = await Attendance.findOne({ _id: id, isDeleted: false })
      .populate("studentId", "fullName name email enrollmentNumber enrollmentNo department year batch")
      .populate("eventId", "name date eventDate startTime endTime venue status")
      .populate("markedBy", "fullName name role");

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found.",
      });
    }

    // Role-based security check: Student can only view their own attendance
    if (req.user.role === "student" && record.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view another student's attendance.",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch attendance record.",
    });
  }
};

/**
 * Get All System Attendance Records (Admin)
 * GET /api/attendance
 * Access: Protected | Allowed Roles: admin
 */
export const getAllAttendance = async (req, res) => {
  try {
    const query = { isDeleted: false };
    if (req.query.eventId && mongoose.Types.ObjectId.isValid(req.query.eventId)) {
      query.eventId = req.query.eventId;
    }
    if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
      query.studentId = req.query.studentId;
    }

    const records = await Attendance.find(query)
      .populate("studentId", "fullName name email enrollmentNumber enrollmentNo department year batch")
      .populate("eventId", "name date eventDate startTime endTime venue status")
      .populate("markedBy", "fullName name role")
      .sort({ attendanceTime: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch all attendance records.",
    });
  }
};

export default {
  scanQRAttendance,
  markManualAttendance,
  getMyAttendance,
  getEventAttendance,
  getAttendanceById,
  getAllAttendance,
};
