import mongoose from "mongoose";

/**
 * User Model Schema
 * Assigned to: Jeny
 */
const userSchema = new mongoose.Schema(
  {
    // Schema fields to be implemented by Jeny
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
