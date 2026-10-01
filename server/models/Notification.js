import mongoose from "mongoose";

/**
 * Notification Model Schema
 * Assigned to: Ishika
 */
const notificationSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Ishika
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
