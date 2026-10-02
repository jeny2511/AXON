import mongoose from "mongoose";

/**
 * Global Settings Model Schema
 * Source of Truth Section 22 & 24:
 * - Central configuration for QR, Attendance, Academic rules, Registration policies, and Security.
 */
const globalSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "system_settings",
      unique: true,
    },
    qr: {
      enabled: { type: Boolean, default: true },
      biometricEnabled: { type: Boolean, default: true },
      uniquePerStudentPerEvent: { type: Boolean, default: true },
      tokenRandomizationEnabled: { type: Boolean, default: true },
      expiryMinutes: { type: Number, default: 15 },
    },
    attendance: {
      allowManualAttendance: { type: Boolean, default: true },
      manualAttendanceIdentifier: { type: String, default: "enrollmentNumber" },
      oneAttendancePerStudentPerEvent: { type: Boolean, default: true },
      continuousQRScanning: { type: Boolean, default: true },
      allowSecondScan: { type: Boolean, default: false },
    },
    academic: {
      promotionMonth: { type: Number, default: 7 }, // July
      promotionDescription: { type: String, default: "manual_by_admin_every_july" },
      batchFormat: { type: String, default: "YYYY-YY" },
    },
    registration: {
      publicStudentRegistration: { type: Boolean, default: true },
      volunteerCreatedByAdmin: { type: Boolean, default: true },
      waitingListEnabled: { type: Boolean, default: false }, // Rule: No waiting list!
      registrationCloseByDate: { type: Boolean, default: true },
      registrationCloseByParticipantLimit: { type: Boolean, default: true },
      allowRegistrationReopen: { type: Boolean, default: true },
    },
    security: {
      passwordHashing: { type: String, default: "bcrypt" },
      authentication: { type: String, default: "JWT" },
      auditLogging: { type: Boolean, default: true },
    },
    softDelete: {
      enabled: { type: Boolean, default: true },
      recoverable: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const GlobalSettings = mongoose.model("GlobalSettings", globalSettingsSchema);
export default GlobalSettings;
