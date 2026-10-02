import mongoose from "mongoose";

/**
 * Volunteer Event Involvement Schema
 * Dummy Data & Section 10/24:
 * - Tracks which volunteers are assigned to which event responsibilities:
 *   (e.g. 'Event Coordinator', 'Technical Head', 'Content Head', 'Design Head').
 */
const volunteerInvolvementSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Volunteer reference is required"],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    responsibility: {
      type: String,
      required: [true, "Volunteer responsibility is required"],
      trim: true,
    },
    roleStatus: {
      type: String,
      enum: ["assigned", "completed", "relieved"],
      default: "assigned",
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

volunteerInvolvementSchema.index({ volunteerId: 1, eventId: 1 }, { unique: true });

const VolunteerInvolvement = mongoose.model("VolunteerInvolvement", volunteerInvolvementSchema);
export default VolunteerInvolvement;
