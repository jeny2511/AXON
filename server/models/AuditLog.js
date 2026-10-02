import mongoose from "mongoose";

/**
 * Audit Log Model Schema
 * Source of Truth Section 21 & 24:
 * - Records critical administrative and operational actions:
 *   login, logout, volunteer changes, event changes, report approval, certificate generation, etc.
 * - Stores who, what action, when, which object, and what changed.
 */
const auditLogSchema = new mongoose.Schema(
  {
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. REPORT_APPROVED, EVENT_CREATED, VOLUNTEER_CREATED, BRANCH_DELETED
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. report, event, user, branch, certificate
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
