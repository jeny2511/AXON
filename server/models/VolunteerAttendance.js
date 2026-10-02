import mongoose from "mongoose";

/**
 * Volunteer Attendance Model Schema
 * Source of Truth Section 9.6 & 24:
 * - Admin manually marks volunteer attendance.
 * - Intentionally separate from student event attendance (NOT a QR system).
 * - Activity types: event, meeting, session, other.
 * - Soft-delete enabled.
 */
const volunteerAttendanceSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Volunteer reference is required"],
      index: true,
    },
    activityType: {
      type: String,
      enum: ["event", "meeting", "session", "other"],
      required: [true, "Activity type is required"],
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    eventName: {
      type: String,
      default: "",
    },
    meetingPlace: {
      type: String,
      default: "", // e.g. TCF Lab, IT Lab
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required (e.g. 10:00 AM)"],
    },
    venue: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      default: "", // e.g. Event Registration Planning
    },
    extraDescription: {
      type: String,
      default: "",
    },
    attendanceStatus: {
      type: String,
      enum: ["present", "absent"],
      default: "present",
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin marker reference is required"],
    },
    // Soft Delete (Section 18)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

volunteerAttendanceSchema.index({ volunteerId: 1, date: 1, activityType: 1 });

const VolunteerAttendance = mongoose.model("VolunteerAttendance", volunteerAttendanceSchema);
export default VolunteerAttendance;
