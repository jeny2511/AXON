import mongoose from "mongoose";

/**
 * Committee Position Model Schema
 * Source of Truth Section 8 & 24:
 * - Admin-configurable committee positions (e.g., President, Technical Head, Event Coordinator).
 * - Soft-delete enabled.
 */
const committeePositionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Committee position name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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

committeePositionSchema.index({ name: 1, isDeleted: 1 });

const CommitteePosition = mongoose.model("CommitteePosition", committeePositionSchema);
export default CommitteePosition;
