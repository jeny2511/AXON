import mongoose from "mongoose";

/**
 * Email Template Schema
 * Source of Truth Section 9.9, 17, 24:
 * - Editable email templates from website.
 * - Categories: student_attendance, volunteer_attendance, report_approval, upcoming_event, certificate_available, etc.
 * - Supports dynamic placeholders.
 */
const emailTemplateSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: [
        "student_attendance",
        "volunteer_attendance",
        "upcoming_event",
        "certificate_available",
        "report_approval",
        "event_rescheduled",
        "custom",
      ],
      required: true,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, "Email subject is required"],
      trim: true,
    },
    body: {
      type: String,
      required: [true, "Email body template is required"],
    },
    placeholders: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

/**
 * Email Send Log Schema (Records of emails dispatched by Admin)
 */
const emailSendRecordSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      default: null,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    attachmentType: {
      type: String,
      default: "", // e.g. student_attendance_xlsx
    },
    attachmentName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "sent",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const EmailSendRecord = mongoose.model("EmailSendRecord", emailSendRecordSchema);
export default EmailTemplate;
