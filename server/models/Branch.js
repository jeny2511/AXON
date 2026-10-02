import mongoose from "mongoose";

/**
 * Branch Model Schema
 * Source of Truth Section 6 & 24:
 * - Admin-configurable branch list (e.g. IT, CE, ICT, EC).
 * - Soft-delete enabled.
 */
const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    shortName: {
      type: String,
      required: [true, "Branch short code is required (e.g. IT, CE)"],
      uppercase: true,
      trim: true,
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

// Compound index for active branches
branchSchema.index({ shortName: 1, isDeleted: 1 });

const Branch = mongoose.model("Branch", branchSchema);
export default Branch;
