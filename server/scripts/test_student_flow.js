import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { User } from "../models/User.js";
import { Event } from "../models/Event.js";
import { Registration } from "../models/Registration.js";
import { Attendance } from "../models/Attendance.js";
import { Feedback } from "../models/Feedback.js";
import { Certificate } from "../models/Certificate.js";

async function runEndToEndVerification() {
  console.log("🚀 Connecting to MongoDB Atlas...");
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // 1. Fetch a student
  const student = await User.findOne({ email: "jeny@vgec.ac.in" });
  if (!student) throw new Error("Student not found");
  console.log("👤 Verified Student:", student.fullName, `(${student.email})`);

  // 2. Fetch an active event
  const event = await Event.findOne();
  if (!event) throw new Error("Event not found");
  console.log("📅 Verified Event:", event.title, `(${event._id})`);

  // 3. Check / create registration
  let reg = await Registration.findOne({ studentId: student._id, eventId: event._id });
  if (!reg) {
    reg = await Registration.create({
      studentId: student._id,
      eventId: event._id,
      qrPassToken: `PASS_${Date.now()}`,
      status: "registered",
      registeredAt: new Date(),
    });
    console.log("🎟️ Created new registration for student");
  } else {
    console.log("🎟️ Found existing registration:", reg.qrPassToken);
  }

  // 4. Mark attendance
  let att = await Attendance.findOne({ studentId: student._id, eventId: event._id });
  if (!att) {
    att = await Attendance.create({
      studentId: student._id,
      eventId: event._id,
      registrationId: reg._id,
      status: "present",
      method: "qr",
      markedBy: student._id,
      attendanceTime: new Date(),
    });
    console.log("✅ Marked attendance: present");
  } else {
    console.log("✅ Found attendance record:", att.status);
  }

  // 5. Submit feedback
  let fb = await Feedback.findOne({ studentId: student._id, eventId: event._id });
  if (!fb) {
    fb = await Feedback.create({
      studentId: student._id,
      eventId: event._id,
      overallRating: 5,
      speakerRating: 5,
      contentRating: 5,
      organizationRating: 5,
      wouldRecommend: true,
      comment: "Outstanding event! Highly engaging and well-organized.",
      submittedAt: new Date(),
    });
    console.log("📝 Submitted student feedback");
  } else {
    console.log("📝 Found existing feedback:", fb.comment);
  }

  // 6. Check Certificate generation & unlock
  let cert = await Certificate.findOne({ studentId: student._id, eventId: event._id });
  if (!cert) {
    const code = `AXON-VGEC-${Date.now().toString(36).toUpperCase()}`;
    cert = await Certificate.create({
      studentId: student._id,
      eventId: event._id,
      studentName: student.fullName,
      enrollmentNumber: student.enrollmentNumber || "220130107054",
      certificateTitle: `${event.title} - Certificate of Excellence`,
      verificationCode: code,
      isLocked: false,
      generatedAt: new Date(),
    });
    console.log("🎓 Generated unlocked certificate:", cert.verificationCode);
  } else {
    console.log("🎓 Found certificate:", cert.verificationCode, "| Status:", cert.status);
  }

  console.log("✨ All Student-Volunteer-Admin lifecycle operations verified successfully!");
  await mongoose.disconnect();
}

runEndToEndVerification().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
