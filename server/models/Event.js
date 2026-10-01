import mongoose from "mongoose";

/**
 * Event Model Schema
 * Assigned to: Preyas
 */
const eventSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Preyas
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
