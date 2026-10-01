import mongoose from "mongoose";

/**
 * Learning Resource Model Schema
 * Assigned to: Ishika
 */
const learningResourceSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Ishika
  },
  {
    timestamps: true,
  }
);

const LearningResource = mongoose.model("LearningResource", learningResourceSchema);
export default LearningResource;
