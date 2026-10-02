import mongoose from "mongoose";

/**
 * OTP Model Schema
 * Used for pre-registration email verification and password reset flows.
 * Automatic TTL index deletes expired OTP documents after 10 minutes.
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      trim: true,
    },
    purpose: {
      type: String,
      enum: ["registration", "password-reset", "login"],
      default: "registration",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Document automatically removed by MongoDB after 10 minutes (600s)
    },
  },
  {
    timestamps: true,
  }
);

otpSchema.index({ email: 1, purpose: 1, verified: 1 });

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
