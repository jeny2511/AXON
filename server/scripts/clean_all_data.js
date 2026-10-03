import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import {
  User,
  Branch,
  CommitteePosition,
  Event,
  Registration,
  StudentEventQR,
  Attendance,
  VolunteerAttendance,
  Feedback,
  FeedbackForm,
  Certificate,
  CertificateTemplate,
  Report,
  Gallery,
  LearningResource,
  VolunteerTask,
  TaskTemplate,
  VolunteerInvolvement,
  Notification,
  EmailTemplate,
  EmailSendRecord,
  AuditLog,
  GlobalSettings,
  AboutTCF,
  OTP,
} from "../models/index.js";

async function cleanAllData() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGO_URI not found in .env");

  console.log("🚀 Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("✅ Connected to MongoDB Atlas");

  console.log("🧹 Clearing all collections...");

  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    StudentEventQR.deleteMany({}),
    Attendance.deleteMany({}),
    VolunteerAttendance.deleteMany({}),
    Feedback.deleteMany({}),
    FeedbackForm.deleteMany({}),
    Certificate.deleteMany({}),
    CertificateTemplate.deleteMany({}),
    Gallery.deleteMany({}),
    Report.deleteMany({}),
    VolunteerTask.deleteMany({}),
    TaskTemplate.deleteMany({}),
    VolunteerInvolvement.deleteMany({}),
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    LearningResource.deleteMany({}),
    CommitteePosition.deleteMany({}),
    Branch.deleteMany({}),
    EmailTemplate.deleteMany({}),
    EmailSendRecord.deleteMany({}),
    OTP.deleteMany({}),
  ]);

  console.log("✅ All dummy data removed completely.");

  // 1. Seed standard engineering branches
  const branches = [
    { name: "Information Technology", shortName: "IT" },
    { name: "Computer Engineering", shortName: "CE" },
    { name: "Electronics & Communication", shortName: "EC" },
    { name: "Information & Communication Tech", shortName: "ICT" },
  ];
  await Branch.insertMany(branches);
  console.log("🏛️ Initialized standard college branches");

  // 2. Seed standard committee positions
  const positions = [
    { name: "President", description: "Club Leader", priority: 1 },
    { name: "Vice President", description: "Club Vice Leader", priority: 2 },
    { name: "Event Manager", description: "Manages events and planning", priority: 3 },
    { name: "Volunteer Coordinator", description: "Coordinates volunteers and duties", priority: 4 },
    { name: "Technical Head", description: "Oversees tech and workshops", priority: 5 },
    { name: "Media & Design Head", description: "Oversees posters and gallery", priority: 6 },
  ];
  await CommitteePosition.insertMany(positions);
  console.log("🎖️ Initialized committee positions");

  // 3. Seed ONLY the single hardcoded Admin account
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("Admin@123", salt);

  const admin = await User.create({
    fullName: "Ishika Patel",
    email: "admin@axon.edu",
    password: hashedPassword,
    role: "admin",
    phoneNumber: "9876543210",
    emailVerified: true,
    accountStatus: "active",
  });

  console.log("👑 Hardcoded Admin account created:");
  console.log(`   - Name: ${admin.fullName}`);
  console.log(`   - Email: ${admin.email}`);
  console.log(`   - Password: Admin@123`);
  console.log(`   - Role: ${admin.role}`);
  console.log(`   - Phone: ${admin.phoneNumber}`);

  console.log("\n✨ System is now 100% clean and ready for real live inputs!");
  await mongoose.disconnect();
}

cleanAllData().catch((err) => {
  console.error("❌ Failed to clean database:", err);
  process.exit(1);
});
