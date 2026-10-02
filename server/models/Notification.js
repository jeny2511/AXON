import mongoose from "mongoose";

/**
 * Notification Model Schema
 * Source of Truth Section 9.8, 11.8, 16, 24:
 * - Channels: website, push, email.
 * - Retains full notification history (not deleted on read).
 * - Types: upcoming_event, registration_deadline, event_rescheduled, certificate_available, report_approval, report_rejection, etc.
 * - Soft-delete enabled.
 */
const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recipient reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "upcoming_event",
        "registration_deadline",
        "event_rescheduled",
        "certificate_available",
        "report_approval",
        "report_rejection",
        "attendance",
        "reminder",
        "feedback",
        "general",
        // Frontend mockData type compatibility
        "registration",
        "deadline",
        "reschedule",
        "certificate",
      ],
      default: "general",
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ["event", "certificate", "report", "user", "task", "none"],
      default: "none",
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    channels: {
      type: [String],
      enum: ["website", "push", "email"],
      default: ["website"],
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

// Frontend aliases
notificationSchema
  .virtual("userId")
  .get(function () { return this.recipientId; })
  .set(function (val) { this.recipientId = val; });

notificationSchema
  .virtual("eventId")
  .get(function () { return this.relatedEntityId; })
  .set(function (val) {
    this.relatedEntityId = val;
    this.relatedEntityType = "event";
  });

notificationSchema
  .virtual("isRead")
  .get(function () { return this.read; })
  .set(function (val) { this.read = val; });

notificationSchema.virtual("notificationId").get(function () {
  return this._id.toString();
});

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
