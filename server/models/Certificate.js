import mongoose from "mongoose";

/**
 * Certificate Model Schema
 * Source of Truth Section 10.14 & 24:
 * - One certificate template used for event.
 * - Generated for students whose attendance is marked present.
 * - Stores student name, enrollment number, PDF URL, and verification code.
 * - Soft-delete enabled.
 */
const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Student reference is required"],
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
    },
    enrollmentNumber: {
      type: String,
      required: [true, "Enrollment number is required"],
      trim: true,
      uppercase: true,
    },
    certificateTitle: {
      type: String,
      default: "Certificate of Participation",
      trim: true,
    },
    pdfUrl: {
      type: String,
      required: [true, "PDF URL is required"],
      trim: true,
    },
    verificationCode: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["generated", "available", "pending"],
      default: "generated",
    },
    sentAutomatically: {
      type: Boolean,
      default: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
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

// One certificate per student per event
certificateSchema.index(
  { studentId: 1, eventId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Certificate = mongoose.model("Certificate", certificateSchema);
export default Certificate;
