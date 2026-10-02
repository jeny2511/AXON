import Attendance from "../models/Attendance.js";
import StudentEventQR from "../models/StudentEventQR.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import VolunteerAttendance from "../models/VolunteerAttendance.js";
import Notification from "../models/Notification.js";

/**
 * Attendance Controller
 * Handles Live QR Scanner Check-in, Manual Attendance by Enrollment Number,
 * Event Attendance Analytics, Student Presence History, and Volunteer Attendance.
 */

// =========================================================================
// 1. SCAN QR CODE ATTENDANCE (Volunteer & Admin)
// =========================================================================
export const scanQRCode = async (req, res) => {
  try {
    const { token, eventId } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({
        success: false,
        message: "QR pass token is required.",
      });
    }

    const cleanToken = token.trim();

    // 1. Query StudentEventQR record
    const qrRecord = await StudentEventQR.findOne({
      token: cleanToken,
      active: true,
    }).populate("studentId", "fullName enrollmentNumber email department phoneNumber profilePhoto isDeleted accountStatus");

    if (!qrRecord) {
      return res.status(404).json({
        success: false,
        message: "Invalid or inactive QR pass token.",
      });
    }

    // 2. Check token expiration
    const now = new Date();
    if (now > new Date(qrRecord.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "This QR pass has expired.",
      });
    }

    // 3. Match event if eventId provided
    if (eventId && qrRecord.eventId.toString() !== eventId.toString()) {
      return res.status(400).json({
        success: false,
        message: "This QR pass belongs to a different event.",
      });
    }

    // 4. Verify Event
    const event = await Event.findOne({ _id: qrRecord.eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event associated with this QR pass not found.",
      });
    }

    if (event.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This event has been cancelled.",
      });
    }

    // 5. Check attendance window (if configured on event)
    if (event.attendance) {
      if (event.attendance.openAt && now < new Date(event.attendance.openAt)) {
        return res.status(400).json({
          success: false,
          message: `Attendance check-in opens at ${new Date(event.attendance.openAt).toLocaleTimeString()}.`,
        });
      }
      if (event.attendance.closeAt && now > new Date(event.attendance.closeAt)) {
        return res.status(400).json({
          success: false,
          message: "Attendance window has closed for this event.",
        });
      }
    }

    const student = qrRecord.studentId;
    if (!student || student.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Student account not found or has been deactivated.",
      });
    }

    // 6. Check duplicate attendance (Strict: Exactly ONE attendance record per student per event!)
    const existingAttendance = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: `Attendance ALREADY marked for ${student.fullName} at ${new Date(existingAttendance.attendanceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        alreadyMarked: true,
        attendance: existingAttendance,
        student: {
          name: student.fullName,
          enrollmentNumber: student.enrollmentNumber,
          department: student.department,
        },
      });
    }

    // 7. Record Attendance
    const attendance = await Attendance.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: qrRecord.registrationId,
      attendanceTime: now,
      markedBy: req.user._id,
      method: "qr",
      status: "present",
    });

    // 8. Notify student of confirmed attendance
    try {
      await Notification.create({
        recipient: student._id,
        recipientRole: "student",
        title: "Attendance Verified",
        message: `Your attendance for '${event.name}' has been verified via QR Scanner.`,
        type: "attendance",
        referenceId: event._id,
        referenceModel: "Event",
      });
    } catch {
      // non-blocking
    }

    return res.status(200).json({
      success: true,
      message: `✅ Attendance marked for ${student.fullName}!`,
      attendanceId: attendance._id,
      markedAt: attendance.attendanceTime,
      method: "qr",
      student: {
        id: student._id,
        fullName: student.fullName,
        name: student.fullName,
        enrollmentNumber: student.enrollmentNumber,
        enrollmentNo: student.enrollmentNumber,
        department: student.department,
        profilePhoto: student.profilePhoto,
      },
      event: {
        id: event._id,
        name: event.name,
      },
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] scanQRCode Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to scan QR attendance.",
    });
  }
};

// =========================================================================
// 2. MARK MANUAL ATTENDANCE (Volunteer & Admin)
// =========================================================================
export const markManualAttendance = async (req, res) => {
  try {
    const { eventId, enrollmentNumber, enrollmentNo, studentId, reason } = req.body;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const enroll = (enrollmentNumber || enrollmentNo || "").trim().toUpperCase();

    // Find student
    let student = null;
    if (enroll) {
      student = await User.findOne({ enrollmentNumber: enroll, isDeleted: false });
    } else if (studentId) {
      student = await User.findOne({ _id: studentId, isDeleted: false });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: `Student with enrollment number '${enroll}' not found.`,
      });
    }

    // Verify registration (Student must be registered to have attendance marked)
    const registration = await Registration.findOne({
      studentId: student._id,
      eventId: event._id,
      status: "registered",
      isDeleted: false,
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.fullName} (${student.enrollmentNumber}) is not registered for this event. Registration is required before attendance.`,
      });
    }

    // Check duplicate
    const existing = await Attendance.findOne({
      studentId: student._id,
      eventId: event._id,
      isDeleted: false,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Attendance already marked for ${student.fullName}.`,
        alreadyMarked: true,
      });
    }

    // Create Manual Attendance
    const attendance = await Attendance.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: registration._id,
      attendanceTime: new Date(),
      markedBy: req.user._id,
      method: "manual",
      status: "present",
    });

    return res.status(200).json({
      success: true,
      message: `Manual attendance recorded for ${student.fullName}.`,
      student: {
        id: student._id,
        name: student.fullName,
        enrollmentNumber: student.enrollmentNumber,
        department: student.department,
      },
      reason: reason || "Manual check-in by volunteer",
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] markManualAttendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark manual attendance.",
    });
  }
};

// =========================================================================
// 3. GET EVENT ATTENDANCE SHEET & STATS (Volunteer & Admin)
// =========================================================================
export const getEventAttendanceSheet = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { search, status, department } = req.query;

    const event = await Event.findOne({ _id: eventId, isDeleted: false });
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    // Fetch all active registrations for this event
    const registrations = await Registration.find({
      eventId: event._id,
      status: "registered",
      isDeleted: false,
    })
      .populate({
        path: "studentId",
        select: "fullName enrollmentNumber email department phoneNumber profilePhoto",
      })
      .sort({ registeredAt: 1 });

    // Fetch all marked attendance records for this event
    const attendances = await Attendance.find({
      eventId: event._id,
      isDeleted: false,
    })
      .populate("markedBy", "fullName role")
      .sort({ attendanceTime: 1 });

    const attendanceMap = new Map();
    attendances.forEach((a) => {
      if (a.studentId) {
        attendanceMap.set(a.studentId.toString(), a);
      }
    });

    let sheet = registrations
      .filter((r) => r.studentId)
      .map((r) => {
        const student = r.studentId;
        const record = attendanceMap.get(student._id.toString());
        const isPresent = Boolean(record);

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
          qrCode: r.qrCode,
          status: isPresent ? "present" : "absent",
          attendanceTime: record ? record.attendanceTime : null,
          method: record ? record.method : null,
          markedBy: record?.markedBy ? record.markedBy.fullName : null,
        };
      });

    // Apply Filters
    if (status) {
      sheet = sheet.filter((row) => row.status === status.toLowerCase());
    }

    if (department) {
      sheet = sheet.filter((row) => row.department.toUpperCase() === department.toUpperCase());
    }

    if (search && search.trim()) {
      const kw = search.trim().toLowerCase();
      sheet = sheet.filter(
        (row) =>
          row.fullName.toLowerCase().includes(kw) ||
          row.enrollmentNumber.toLowerCase().includes(kw) ||
          row.email.toLowerCase().includes(kw)
      );
    }

    const totalRegistered = registrations.length;
    const totalPresent = attendances.length;
    const totalAbsent = Math.max(0, totalRegistered - totalPresent);
    const turnoutRate = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

    return res.status(200).json({
      success: true,
      event: {
        id: event._id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        participantsLimit: event.participantsLimit,
      },
      stats: {
        totalRegistered,
        totalPresent,
        totalAbsent,
        turnoutRate: `${turnoutRate}%`,
      },
      attendanceSheet: sheet,
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] getEventAttendanceSheet Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve attendance sheet.",
    });
  }
};

// =========================================================================
// 4. GET MY PRESENCE / ATTENDANCE (Student)
// =========================================================================
export const getMyPresence = async (req, res) => {
  try {
    const studentId = req.user._id;

    const attendances = await Attendance.find({
      studentId,
      isDeleted: false,
    })
      .populate({
        path: "eventId",
        select: "name date endDate venue poster category certificateAvailable",
      })
      .sort({ attendanceTime: -1 });

    return res.status(200).json({
      success: true,
      count: attendances.length,
      attendances: attendances.map((a) => ({
        id: a._id,
        _id: a._id,
        eventId: a.eventId?._id,
        eventName: a.eventId?.name || "Event",
        date: a.eventId?.date,
        venue: a.eventId?.venue,
        poster: a.eventId?.poster,
        category: a.eventId?.category,
        certificateAvailable: a.eventId?.certificateAvailable,
        attendanceTime: a.attendanceTime,
        method: a.method,
        status: a.status,
      })),
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] getMyPresence Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch attendance history.",
    });
  }
};

// =========================================================================
// 5. MARK VOLUNTEER DUTY ATTENDANCE (Admin)
// =========================================================================
export const markVolunteerDutyAttendance = async (req, res) => {
  try {
    const {
      volunteerId,
      activityType,
      eventId,
      eventName,
      date,
      time,
      venue,
      meetingPlace,
      topic,
      attendanceStatus,
    } = req.body;

    if (!volunteerId || !activityType || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Volunteer ID, activity type, date, and time are required.",
      });
    }

    const volunteer = await User.findOne({ _id: volunteerId, role: "volunteer", isDeleted: false });
    if (!volunteer) {
      return res.status(404).json({
        success: false,
        message: "Volunteer account not found.",
      });
    }

    const record = await VolunteerAttendance.create({
      volunteerId: volunteer._id,
      activityType,
      eventId: eventId || null,
      eventName: eventName || "",
      date: new Date(date),
      time,
      venue: venue || "",
      meetingPlace: meetingPlace || "",
      topic: topic || "",
      attendanceStatus: attendanceStatus || "present",
      markedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: `Volunteer attendance marked for ${volunteer.fullName}.`,
      record,
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] markVolunteerDutyAttendance Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to mark volunteer attendance.",
    });
  }
};

// =========================================================================
// 6. GET VOLUNTEER ATTENDANCE RECORDS (Admin & Volunteer)
// =========================================================================
export const getVolunteerAttendanceRecords = async (req, res) => {
  try {
    const { volunteerId, eventId, activityType } = req.query;

    const query = { isDeleted: false };
    if (volunteerId) query.volunteerId = volunteerId;
    if (eventId) query.eventId = eventId;
    if (activityType) query.activityType = activityType;

    // If caller is volunteer, only allow viewing their own attendance
    if (req.user.role === "volunteer") {
      query.volunteerId = req.user._id;
    }

    const records = await VolunteerAttendance.find(query)
      .populate("volunteerId", "fullName enrollmentNumber department")
      .populate("markedBy", "fullName role")
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("❌ [Attendance Controller] getVolunteerAttendanceRecords Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch volunteer attendance records.",
    });
  }
};

export default {
  scanQRCode,
  markManualAttendance,
  getEventAttendanceSheet,
  getMyPresence,
  markVolunteerDutyAttendance,
  getVolunteerAttendanceRecords,
};
