import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Event from "../models/Event.js";
import FeedbackForm from "../models/FeedbackForm.js";
import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function testFeedbackValidation() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");

    const admin = await User.findOne({ role: "admin" });
    const event = await Event.findOne({ isDeleted: false });

    if (!admin || !event) {
      console.log("Admin or Event not found. Skipping test.");
      process.exit(0);
    }

    // 1. Create a dynamic feedback form with 6 questions
    const questions = [
      { question: "Overall rating", type: "rating", required: true },
      { question: "Content quality", type: "rating", required: true },
      { question: "Session format preference", type: "radio", options: ["Offline", "Online", "Hybrid"], required: true },
      { question: "Topics you want next", type: "checkbox", options: ["AI / ML", "Web Dev", "Cloud", "Cybersecurity"], required: true },
      { question: "Key takeaway from this event", type: "textarea", required: false },
      { question: "Any additional suggestions", type: "textarea", required: false },
    ];

    let form = await FeedbackForm.findOneAndUpdate(
      { eventId: event._id },
      {
        eventId: event._id,
        title: `${event.name} - Official Feedback Form`,
        questions,
        createdBy: admin._id,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    console.log("✅ FeedbackForm created successfully with", form.questions.length, "questions");

    await mongoose.disconnect();
    console.log("Validation test complete.");
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testFeedbackValidation();
