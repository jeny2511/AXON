import mongoose from "mongoose";

/**
 * Feedback Question & Form Schema
 * Source of Truth Section 10.11 & 24:
 * - Common/fixed feedback form managed by volunteers and linked to specific events.
 * - Questions created/configured by volunteers.
 */
const feedbackQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["rating", "textarea", "boolean", "radio", "checkbox", "text", "select"],
      default: "rating",
    },
    options: [{
      type: String,
      trim: true,
    }],
    scale: {
      type: Number,
      default: 5,
    },
    required: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const feedbackFormSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      unique: true, // One form configuration per event
      index: true,
    },
    title: {
      type: String,
      default: "Event Feedback Form",
      trim: true,
    },
    questions: [feedbackQuestionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);
export default FeedbackForm;
