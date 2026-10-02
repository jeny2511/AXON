import mongoose from "mongoose";

/**
 * Learning Resource Model Schema
 * Source of Truth Section 10.15, 11.7, 24:
 * - Cybersecurity news, research papers, case studies, tools, articles.
 * - Supports article text, PDF, external links, images, and videos.
 * - Soft-delete enabled.
 */
const learningResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: ["news", "research paper", "case study", "tool", "awareness", "article"],
      default: "article",
      index: true,
    },
    contentType: {
      type: String,
      enum: ["article", "pdf", "external-link", "video", "image"],
      default: "article",
    },
    content: {
      type: String, // Rich text or markdown for articles
      default: "",
    },
    pdfUrl: {
      type: String,
      default: "",
    },
    externalUrl: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    thumbnail: {
      type: String,
      default: "",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author reference is required"],
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

learningResourceSchema.index({ title: "text", description: "text", content: "text", tags: "text" });

const LearningResource = mongoose.model("LearningResource", learningResourceSchema);
export default LearningResource;
