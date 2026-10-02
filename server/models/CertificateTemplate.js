import mongoose from "mongoose";

/**
 * Certificate Template Model Schema
 * Source of Truth Section 10.14 & 24:
 * - Exactly ONE active certificate template for the platform.
 * - Managed by Volunteer/Admin.
 * - Stores template PDF URL, placeholders ('studentName', 'enrollmentNumber'), and active status.
 */
const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      default: "TCF Participation Certificate",
    },
    templateFile: {
      type: String,
      required: [true, "Template PDF URL is required"],
      trim: true,
    },
    placeholders: {
      type: [String],
      default: ["studentName", "enrollmentNumber"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const CertificateTemplate = mongoose.model("CertificateTemplate", certificateTemplateSchema);
export default CertificateTemplate;
