import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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
  Gallery,
  Report,
  VolunteerTask,
  AuditLog,
  Notification,
} from "../models/index.js";

async function verifyCleanState() {
  await mongoose.connect(process.env.MONGO_URI);

  const [
    userCount,
    adminCount,
    volCount,
    studentCount,
    eventCount,
    regCount,
    attCount,
    fbCount,
    certCount,
    galCount,
    taskCount,
    posCount,
    branchCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ role: "volunteer" }),
    User.countDocuments({ role: "student" }),
    Event.countDocuments(),
    Registration.countDocuments(),
    Attendance.countDocuments(),
    Feedback.countDocuments(),
    Certificate.countDocuments(),
    Gallery.countDocuments(),
    VolunteerTask.countDocuments(),
    CommitteePosition.countDocuments(),
    Branch.countDocuments(),
  ]);

  const admin = await User.findOne({ role: "admin" });

  console.log("📊 Database Collection Counts:");
  console.log(`   - Total Users: ${userCount} (Admins: ${adminCount}, Volunteers: ${volCount}, Students: ${studentCount})`);
  console.log(`   - Events: ${eventCount}`);
  console.log(`   - Registrations: ${regCount}`);
  console.log(`   - Attendance Records: ${attCount}`);
  console.log(`   - Feedback Submissions: ${fbCount}`);
  console.log(`   - Certificates: ${certCount}`);
  console.log(`   - Gallery Albums: ${galCount}`);
  console.log(`   - Tasks: ${taskCount}`);
  console.log(`   - Active Branches: ${branchCount}`);
  console.log(`   - Committee Positions: ${posCount}`);
  console.log("\n👑 Single Admin User in DB:");
  console.log(`   - Name: ${admin?.fullName}`);
  console.log(`   - Email: ${admin?.email}`);
  console.log(`   - Phone: ${admin?.phoneNumber}`);
  console.log(`   - Role: ${admin?.role}`);

  await mongoose.disconnect();
}

verifyCleanState().catch(console.error);
