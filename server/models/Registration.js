import mongoose from "mongoose";

/**
 * Registration Model Schema
 * Assigned to: Preyas
 */
const registrationSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Preyas
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
