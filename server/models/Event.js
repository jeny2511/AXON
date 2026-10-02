import mongoose from "mongoose";

/**
 * Event Model Schema
 * Source of Truth Section 10, 24, 25:
 * - High-level event data: name, speaker, date, endDate, startTime, endTime, venue, description, poster.
 * - Registration window (openAt, closeAt, reopened).
 * - Attendance window (openAt, closeAt).
 * - Capacity: participantsLimit (no waiting list!).
 * - Eligibility: branchIds and academic years.
 * - Rulebooks: supports multiple PDF documents.
 * - Event status: draft, published, registration_open, registration_closed, ongoing, completed, cancelled.
 * - Soft-delete enabled.
 */
const rulebookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "pdf",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    speaker: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Event start date is required"],
      index: true,
    },
    endDate: {
      type: Date,
      default: null, // If null, event ends on the same day as start date
    },
    startTime: {
      type: String,
      required: [true, "Start time is required (e.g. 10:00 AM)"],
      trim: true,
    },
    endTime: {
      type: String,
      required: [true, "End time is required (e.g. 04:00 PM)"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Event venue is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    poster: {
      type: String,
      default: "", // Cloudinary URL
    },
    // Optional category/type for frontend display compatibility
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    // Registration Window (Section 10.2)
    registration: {
      openAt: {
        type: Date,
        default: Date.now,
      },
      closeAt: {
        type: Date,
        required: [true, "Registration closing date & time is required"],
        index: true,
      },
      reopened: {
        type: Boolean,
        default: false,
      },
      reopenedAt: {
        type: Date,
        default: null,
      },
    },
    // Attendance Window
    attendance: {
      openAt: {
        type: Date,
        default: null,
      },
      closeAt: {
        type: Date,
        default: null,
      },
    },
    // Capacity Limit (Section 10.3 - No waiting list!)
    participantsLimit: {
      type: Number,
      required: [true, "Participants limit is required"],
      min: [1, "Participants limit must be at least 1"],
    },
    // Eligibility (Section 10.4)
    eligibility: {
      enabled: {
        type: Boolean,
        default: false,
      },
      years: {
        type: [Number], // e.g. [1, 2, 3, 4]
        default: [],
      },
      branchIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Branch",
        },
      ],
      // Fallback branch codes (e.g. ['IT', 'CE']) for direct matching
      branchCodes: {
        type: [String],
        default: [],
      },
    },
    // Multiple Rulebook PDFs (Section 10.5)
    rulebooks: [rulebookSchema],
    // Event Status (Section 10.6)
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "registration_open",
        "registration_closed",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "published",
      index: true,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    certificateAvailable: {
      type: Boolean,
      default: true,
    },
    feedbackRequired: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Effective End Date
eventSchema.virtual("effectiveEndDate").get(function () {
  return this.endDate || this.date;
});

// Indexes for fast searching and filtering
eventSchema.index({ name: "text", description: "text", venue: "text", speaker: "text" });
eventSchema.index({ date: 1, isDeleted: 1 });
eventSchema.index({ "registration.closeAt": 1, isDeleted: 1 });

const Event = mongoose.model("Event", eventSchema);
export default Event;
