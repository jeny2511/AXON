import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User Model Schema
 * Source of Truth Section 2, 3, 4, 5, 7, 24:
 * - Exactly 3 roles: student, volunteer, admin.
 * - Single central users collection.
 * - Profile photo is compulsory for students and volunteers.
 * - Batch stores degree duration ({ startYear, endYear }). Current academic year is calculated, NOT permanently stored.
 * - Volunteers are Admin-created, have committeePosition and workingUnder (referencing another volunteer/user).
 * - Soft-delete enabled.
 */
const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: {
        values: ["student", "volunteer", "admin"],
        message: "{VALUE} is not a valid role. Allowed roles: student, volunteer, admin.",
      },
      default: "student",
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password hash by default
    },
    enrollmentNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Only students and volunteers have enrollment numbers
      index: true,
    },
    admissionType: {
      type: String,
      enum: ["regular", "d2d"],
      default: "regular",
      index: true, // Used to distinguish 4-year degree (regular) vs 3-year lateral entry (d2d)
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    // Optional fallback string field if branch code/name is passed directly
    branchCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    batch: {
      startYear: {
        type: Number,
        min: 2000,
        max: 2100,
      },
      endYear: {
        type: Number,
        min: 2000,
        max: 2100,
      },
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be a valid 10-digit number"],
    },
    profilePhoto: {
      type: String,
      default: "", // Cloudinary URL
    },
    // Volunteer-specific attributes
    committeePosition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommitteePosition",
      default: null,
    },
    workingUnder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // References another volunteer/user
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // Admin who created the volunteer
    },
    // Email OTP Verification flow (Section 3)
    emailVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    // Password reset flow
    resetPasswordOTP: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    accountStatus: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: Batch display string (e.g., "2024-28")
userSchema.virtual("batchDisplay").get(function () {
  if (this.batch && this.batch.startYear && this.batch.endYear) {
    const endTwoDigits = String(this.batch.endYear).slice(-2);
    return `${this.batch.startYear}-${endTwoDigits}`;
  }
  return "";
});

// Virtual: Current Academic Year (Calculated dynamically, NOT permanently stored - Section 7)
// Logic:
// - Cutoff is strictly 15th July every year.
// - Entry year: Regular = 1, D2D = 2.
// - Checks calendar year against batch.startYear:
//     - If calendar year === batch.startYear: 1st Year (Regular) or 2nd Year (D2D)
//     - In next calendar year (e.g. 2025 for 2024 batch):
//         * Before 15th July: 1st Year (Regular) / 2nd Year (D2D)
//         * On/After 15th July: 2nd Year (Regular) / 3rd Year (D2D)
userSchema.virtual("currentYear").get(function () {
  if (!this.batch || !this.batch.startYear) return null;

  const now = new Date();
  const calYear = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12
  const day = now.getDate();

  // Starting academic year of current degree program
  const entryYear = this.admissionType === "d2d" ? 2 : 1;

  // If calendar year is the same as batch start year, they are in their entry year
  if (calYear === this.batch.startYear) {
    return entryYear;
  }

  // Academic promotion happens on 15th July every year
  const isAfterJuly15 = month > 7 || (month === 7 && day >= 15);
  const effectiveSessionYear = isAfterJuly15 ? calYear : calYear - 1;

  const yearsPassed = effectiveSessionYear - this.batch.startYear;
  const calculatedYear = entryYear + yearsPassed;

  if (calculatedYear < entryYear) return entryYear;
  if (calculatedYear > 4) return null; // Graduated / Alumni
  return calculatedYear;
});

// Virtual: Academic Status ('studying' if year 1-4, 'graduated' if finished)
userSchema.virtual("academicStatus").get(function () {
  if (!this.batch || !this.batch.startYear) return "active";
  return this.currentYear ? "studying" : "graduated";
});

/**
 * Static Helper: getRegistrationOptions
 * Dynamically provides ONLY ACTIVE (non-graduated) Year & Batch options for registration:
 * - As soon as a batch's duration is over (after 15th July of their final year), it is AUTOMATICALLY REMOVED.
 * - Regular (4-year degree): Keeps currently studying batches (1st, 2nd, 3rd, 4th year) + upcoming admission batch.
 * - D2D (3-year lateral degree): Keeps currently studying batches (2nd, 3rd, 4th year) + upcoming admission batch.
 */
userSchema.statics.getRegistrationOptions = function (admissionType = "regular") {
  const now = new Date();
  const calYear = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Academic cutoff is strictly 15th July
  const isAfterJuly15 = month > 7 || (month === 7 && day >= 15);
  // Current active academic session (e.g. in Aug 2024 -> 2024; in Feb 2025 -> 2024)
  const currentSessionYear = isAfterJuly15 ? calYear : calYear - 1;

  if (admissionType === "d2d") {
    const years = [2, 3, 4];
    const batches = [];

    // Max start year: includes upcoming batch if in new admission period
    const maxStartYear = isAfterJuly15 ? currentSessionYear : calYear;
    // Oldest active studying D2D batch (4th year): in session 2024, started in 2022 (graduates July 15, 2025).
    // Batches that started 3 years ago or earlier have already graduated and are removed.
    const minStartYear = currentSessionYear - 2;

    for (let start = maxStartYear; start >= minStartYear; start--) {
      batches.push({
        startYear: start,
        endYear: start + 3,
        display: `${start}-${String(start + 3).slice(-2)}`,
        currentAcademicYear: start === maxStartYear && !isAfterJuly15 ? 2 : 2 + (currentSessionYear - start),
      });
    }
    return { admissionType: "d2d", years, batches };
  } else {
    const years = [1, 2, 3, 4];
    const batches = [];

    // Max start year: includes upcoming batch if in new admission period
    const maxStartYear = isAfterJuly15 ? currentSessionYear : calYear;
    // Oldest active studying Regular batch (4th year): in session 2024, started in 2021 (graduates July 15, 2025).
    // Batches that started 4 years ago or earlier have already graduated and are removed.
    const minStartYear = currentSessionYear - 3;

    for (let start = maxStartYear; start >= minStartYear; start--) {
      batches.push({
        startYear: start,
        endYear: start + 4,
        display: `${start}-${String(start + 4).slice(-2)}`,
        currentAcademicYear: start === maxStartYear && !isAfterJuly15 ? 1 : 1 + (currentSessionYear - start),
      });
    }
    return { admissionType: "regular", years, batches };
  }
};

// Validate that newly registered students cannot register for an expired/graduated batch
userSchema.pre("validate", function (next) {
  if (this.isNew && this.role === "student" && this.batch && this.batch.startYear && this.batch.endYear) {
    const now = new Date();
    const calYear = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const isAfterJuly15 = month > 7 || (month === 7 && day >= 15);
    const graduationYear = this.batch.endYear;

    // A batch has graduated if current calendar year > endYear OR (calYear === endYear and isAfterJuly15)
    const isGraduated = calYear > graduationYear || (calYear === graduationYear && isAfterJuly15);
    if (isGraduated) {
      return next(
        new Error(
          `Batch ${this.batch.startYear}-${this.batch.endYear} has already completed its duration and graduated. Registration is closed for this batch.`
        )
      );
    }
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to verify entered password against hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compound index for enrollment unique per role (active users)
userSchema.index(
  { enrollmentNumber: 1, role: 1 },
  { unique: true, partialFilterExpression: { enrollmentNumber: { $type: "string" }, isDeleted: false } }
);

const User = mongoose.model("User", userSchema);
export default User;
