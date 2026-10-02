import mongoose from "mongoose";

/**
 * Student Event QR / Token Model Schema
 * Source of Truth Section 12 & 24:
 * - Event-specific and student-specific secure QR token.
 * - Random cryptographically secure token.
 * - Backend token expiration check.
 * - Optional biometric gate toggle.
 */
const studentEventQRSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    registrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    biometricRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

studentEventQRSchema.index({ studentId: 1, eventId: 1, active: 1 });

const StudentEventQR = mongoose.model("StudentEventQR", studentEventQRSchema);
export default StudentEventQR;
