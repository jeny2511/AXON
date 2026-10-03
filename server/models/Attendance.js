import mongoose from "mongoose";

/**
 * Student Attendance Model Schema
 * Source of Truth Section 10.8, 10.9, 10.10, 13, 24:
 * - Exactly ONE attendance record per student per event.
 * - Stores attendanceTime.
 * - NO check-in/check-out model.
 * - Supports both 'qr' scanning and 'manual' enrollment-number entry.
 * - Soft-delete enabled.
 */
const studentAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: [true, "Registration reference is required"],
    },
    attendanceTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Volunteer/marker reference is required"],
    },
    method: {
      type: String,
      enum: ["qr", "manual"],
      default: "qr",
    },
    status: {
      type: String,
      enum: ["present", "absent", "pending"],
      default: "present",
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Frontend aliases: verifiedBy maps to markedBy, attendanceId maps to _id
studentAttendanceSchema
  .virtual("verifiedBy")
  .get(function () { return this.markedBy; })
  .set(function (val) { this.markedBy = val; });

studentAttendanceSchema.virtual("attendanceId").get(function () {
  return this._id.toString();
});

// Enforce exactly ONE attendance record per student per event
studentAttendanceSchema.index(
  { studentId: 1, eventId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Attendance = mongoose.model("Attendance", studentAttendanceSchema);
export { Attendance };
export default Attendance;
