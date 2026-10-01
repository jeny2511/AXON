import mongoose from "mongoose";

/**
 * Gallery Model Schema
 * Assigned to: Ishika
 */
const gallerySchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Ishika
  },
  {
    timestamps: true,
  }
);

const Gallery = mongoose.model("Gallery", gallerySchema);
export default Gallery;
