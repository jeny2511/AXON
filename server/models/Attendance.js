import mongoose from "mongoose";

/**
 * Attendance Model Schema
 * Assigned to: Dhruvi
 */
const attendanceSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Dhruvi
  },
  {
    timestamps: true,
  }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;
