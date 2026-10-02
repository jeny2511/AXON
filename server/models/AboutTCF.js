import mongoose from "mongoose";

/**
 * About TCF & Team Schema
 * Source of Truth Section 11.5 & 11.6:
 * - Organization vision, mission, description.
 * - Team members list (photo, name, role, description).
 * - Contact information.
 */
const teamMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const aboutTCFSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      default: "The Cyber Force (TCF)",
    },
    vision: {
      type: String,
      required: true,
    },
    mission: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    teamMembers: [teamMemberSchema],
    contactInfo: {
      email: { type: String, default: "contact@tcf.demo" },
      phone: { type: String, default: "+91 98765 43210" },
      address: { type: String, default: "Vishwakarma Government Engineering College, Chandkheda, Ahmedabad" },
      website: { type: String, default: "https://example.com" },
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const AboutTCF = mongoose.model("AboutTCF", aboutTCFSchema);
export default AboutTCF;
