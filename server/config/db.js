import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User.js";

/**
 * Connect to MongoDB Atlas and Seed Default Admin Account
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!mongoURI || mongoURI.includes("<username>") || mongoURI.includes("placeholder")) {
      console.warn(
        "⚠️ [Database] MONGO_URI is missing or contains placeholder values in .env. Database connection skipped for now."
      );
      return;
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ [Database] MongoDB Connected: ${conn.connection.host}`);

    // Seed default admin account if not already present
    await User.seedDefaultAdmin();
  } catch (error) {
    console.error(`❌ [Database] MongoDB Connection Error: ${error.message}`);
  }
};

export default connectDB;

