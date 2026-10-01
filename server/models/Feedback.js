import mongoose from "mongoose";

/**
 * Feedback Model Schema
 * Assigned to: Ishika
 */
const feedbackSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Ishika
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
