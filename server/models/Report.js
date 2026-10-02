import mongoose from "mongoose";

/**
 * Event Report Model Schema
 * Source of Truth Section 9.5, 10.13, 24:
 * - Exactly ONE report per event.
 * - Uploaded by Volunteer, reviewed/approved/rejected by Admin.
 * - Revision and approval history is retained.
 * - Soft-delete enabled.
 */
const reportHistorySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["uploaded", "rejected", "resubmitted", "approved"],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedAt: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const reportSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      unique: true, // Exactly ONE report per event (Section 9.5)
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader volunteer reference is required"],
    },
    reportUrl: {
      type: String,
      required: [true, "Report PDF URL is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "resubmitted"],
      default: "pending",
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    history: [reportHistorySchema],
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

const Report = mongoose.model("Report", reportSchema);
export default Report;
