import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["student", "volunteer", "admin"],
      default: "student",
      required: true,
    },

    enrollmentNo: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },

    department: {
      type: String,
      trim: true,
    },

    year: Number,
    semester: Number,
    batch: String,
    phone: String,

    password: {
      type: String,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: Date,

    passwordResetToken: {
      type: String,
      select: false,
    },

    passwordResetExpires: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;