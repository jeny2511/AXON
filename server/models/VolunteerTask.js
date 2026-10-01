import mongoose from "mongoose";

/**
 * Volunteer Task Model Schema
 * Assigned to: Dhrumi
 */
const volunteerTaskSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Dhrumi
  },
  {
    timestamps: true,
  }
);

const VolunteerTask = mongoose.model("VolunteerTask", volunteerTaskSchema);
export default VolunteerTask;
