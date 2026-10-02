import mongoose from "mongoose";

/**
 * Event Registration Model Schema
 * Source of Truth Section 13, 14, 24:
 * - Resolves STUDENT N:M EVENT relationship.
 * - Essential Rule: Registration is NOT attendance! (Registered != Attended).
 * - Enforces exactly ONE registration per student per event.
 * - Soft-delete enabled.
 */
const registrationSchema = new mongoose.Schema(
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
    registeredAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["registered", "cancelled"],
      default: "registered",
    },
    cancellationReason: {
      type: String,
      default: "",
    },
    qrCode: {
      type: String,
      default: "", // e.g. QR-EV001-ST001
      index: true,
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

// Frontend aliases
registrationSchema
  .virtual("registrationDate")
  .get(function () { return this.registeredAt; })
  .set(function (val) { this.registeredAt = val; });

registrationSchema.virtual("registrationId").get(function () {
  return this._id.toString();
});

// Enforce ONE registration per student per event for active registrations
registrationSchema.index(
  { studentId: 1, eventId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
