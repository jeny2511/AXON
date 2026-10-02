import mongoose from "mongoose";

/**
 * Event Gallery Model Schema
 * Source of Truth Section 10.12, 24 & CRITICAL SPECIAL RULE Section 27:
 * - Gallery is MANUALLY maintained and intentionally NOT automatically foreign-keyed to Event document.
 * - Stores eventName, venue, date, time, description, banner, photos, videos, tags.
 * - Soft-delete enabled.
 */
const gallerySchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
      index: true,
    },
    venue: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: null,
    },
    time: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    banner: {
      type: String,
      default: "", // Cloudinary URL
    },
    photos: {
      type: [String],
      default: [],
    },
    videos: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
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
  }
);

gallerySchema.index({ eventName: "text", description: "text", tags: "text" });

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;
