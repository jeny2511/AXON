import mongoose from "mongoose";

/**
 * Connect to MongoDB Atlas
 * Handled by Preyas
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
  } catch (error) {
    console.error(`❌ [Database] MongoDB Connection Error: ${error.message}`);
  }
};

export default connectDB;
