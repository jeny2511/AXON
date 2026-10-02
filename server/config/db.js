import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Connect to MongoDB Atlas
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
