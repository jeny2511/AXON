import mongoose from "mongoose";

/**
 * Certificate Model Schema
 * Assigned to: Ishika
 */
const certificateSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Ishika
  },
  {
    timestamps: true,
  }
);

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
