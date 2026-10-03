import mongoose from "mongoose";

/**
 * Task Template Schema (Predefined tasks reusable across events)
 * Source of Truth Section 9.7, 24:
 * e.g. "Prepare Registration Desk", "Arrange Event Venue", "Prepare Attendance Setup"
 */
const taskTemplateSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const TaskTemplate = mongoose.model("TaskTemplate", taskTemplateSchema);

/**
 * Volunteer Event Task Model Schema
 * Source of Truth Section 9.7 & 24:
 * - Event-specific tasks assigned to volunteers.
 * - Supports template-based or custom-created tasks.
 * - Volunteer marks completion / checkbox. Admin monitors.
 * - Soft-delete enabled.
 */
const volunteerTaskSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    source: {
      type: String,
      enum: ["template", "custom"],
      default: "custom",
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskTemplate",
      default: null,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Volunteer assigned
      index: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Soft Delete (Section 18)
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

volunteerTaskSchema.index({ eventId: 1, completed: 1, isDeleted: 1 });

const VolunteerTask = mongoose.model("VolunteerTask", volunteerTaskSchema);
export default VolunteerTask;
