import mongoose from "mongoose";

/**
 * Feedback Model Schema
 * Source of Truth Section 10.11 & 24:
 * - Linked to student and event.
 * - Cannot be edited by student after submission (editable: false).
 * - Fixed questions format with ratings (1-5), recommendation, and comments.
 * - Soft-delete enabled.
 */
const feedbackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    overallRating: {
      type: Number,
      required: [true, "Overall rating is required"],
      min: 1,
      max: 5,
    },
    speakerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    organizationRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    contentRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5,
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    comment: {
      type: String,
      trim: true,
      default: "",
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false, // Students cannot edit after submission (Section 10.11)
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

// One feedback per student per event
feedbackSchema.index(
  { eventId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export { Feedback };
export default Feedback;
