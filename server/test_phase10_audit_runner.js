import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";
import Attendance from "./models/Attendance.js";
import Feedback from "./models/Feedback.js";
import Certificate from "./models/Certificate.js";
import VolunteerTask from "./models/VolunteerTask.js";
import VolunteerAttendance from "./models/VolunteerAttendance.js";
import VolunteerInvolvement from "./models/VolunteerInvolvement.js";
import Gallery from "./models/Gallery.js";
import LearningResource from "./models/LearningResource.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5088;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runAudit() {
  console.log("================================================================");
  console.log("       AXON PHASE 10: FULL SYSTEM SECURITY & AUDIT SUITE       ");
  console.log("================================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/registrations", registrationRoutes);
  app.use("/api/attendance", attendanceRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/certificates", certificateRoutes);
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/learning", learningRoutes);
  app.use("/api/volunteer", volunteerRoutes);
  app.use("/api/admin", adminRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(TEST_PORT);
  console.log(`Audit server listening on port ${TEST_PORT}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = "") {
    if (condition) {
      console.log(`  [PASS] Test: ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test: ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // Cleanup prior audit records
    await User.deleteMany({ email: /audit_p10_/ });
    await Event.deleteMany({ name: /Audit P10/ });

    // Seed test identities
    const student1 = await User.create({
      fullName: "Audit Student 1",
      email: "audit_p10_stu1@axon.edu",
      password: "password123",
      role: "student",
      enrollmentNumber: "AUD999001",
      department: "Information Technology",
      phoneNumber: "9876543210",
      batch: { startYear: 2023, endYear: 2027 },
      semester: 4,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/stu1.jpg",
    });

    const student2 = await User.create({
      fullName: "Audit Student 2",
      email: "audit_p10_stu2@axon.edu",
      password: "password123",
      role: "student",
      enrollmentNumber: "AUD999002",
      department: "Computer Engineering",
      phoneNumber: "9876543211",
      batch: { startYear: 2023, endYear: 2027 },
      semester: 4,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/stu2.jpg",
    });

    const volunteer1 = await User.create({
      fullName: "Audit Volunteer 1",
      email: "audit_p10_vol1@axon.edu",
      password: "password123",
      role: "volunteer",
      enrollmentNumber: "AUD999003",
      department: "Information Technology",
      phoneNumber: "9876543212",
      batch: { startYear: 2022, endYear: 2026 },
      semester: 6,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/vol1.jpg",
      committeePosition: new mongoose.Types.ObjectId(),
      workingUnder: new mongoose.Types.ObjectId(),
    });

    const volunteer2 = await User.create({
      fullName: "Audit Volunteer 2",
      email: "audit_p10_vol2@axon.edu",
      password: "password123",
      role: "volunteer",
      enrollmentNumber: "AUD999004",
      department: "Electronics & Communication",
      phoneNumber: "9876543213",
      batch: { startYear: 2022, endYear: 2026 },
      semester: 6,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/vol2.jpg",
      committeePosition: new mongoose.Types.ObjectId(),
      workingUnder: new mongoose.Types.ObjectId(),
    });

    const admin = await User.create({
      fullName: "Audit Admin",
      email: "audit_p10_admin@axon.edu",
      password: "password123",
      role: "admin",
      enrollmentNumber: "AUD999005",
      department: "Information Technology",
      phoneNumber: "9876543214",
      batch: { startYear: 2022, endYear: 2026 },
      semester: 8,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/admin.jpg",
    });

    const stu1Token = generateToken(student1._id);
    const stu2Token = generateToken(student2._id);
    const vol1Token = generateToken(volunteer1._id);
    const vol2Token = generateToken(volunteer2._id);
    const adminToken = generateToken(admin._id);

    console.log("\n--- AUDIT 1: AUTHENTICATION & TOKEN INTEGRITY ---");

    // 1. Missing token -> 401
    const a1 = await fetch(`${BASE_URL}/users/profile`);
    assert(a1.status === 401, "A1. Missing Bearer token returns 401");

    // 2. Tampered JWT signature -> 401
    const tamperedToken = stu1Token.substring(0, stu1Token.length - 6) + "XXXXXX";
    const a2 = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${tamperedToken}` },
    });
    assert(a2.status === 401, "A2. Tampered JWT signature returns 401");

    // 3. Expired token -> 401
    const expiredToken = jwt.sign(
      { id: student1._id },
      process.env.JWT_SECRET || "axon_jwt_secret_dev",
      { expiresIn: "-10s" }
    );
    const a3 = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(a3.status === 401, "A3. Expired JWT token returns 401");

    // 4. Inactive/Suspended user token -> 401
    student2.accountStatus = "suspended";
    await student2.save();
    const a4 = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    assert(a4.status === 401, "A4. Suspended user token is rejected with 401");
    student2.accountStatus = "active";
    await student2.save();

    // 5. Soft-deleted user token -> 401
    student2.isDeleted = true;
    await student2.save();
    const a5 = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    assert(a5.status === 401, "A5. Soft-deleted user token is rejected with 401");
    student2.isDeleted = false;
    await student2.save();

    console.log("\n--- AUDIT 2: RBAC MATRIX & PRIVILEGE BOUNDARIES ---");

    // 6. Student cannot access Admin user management
    const a6 = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    assert(a6.status === 403, "A6. Student accessing /api/admin/users returns 403");

    // 7. Student cannot access Volunteer tasks
    const a7 = await fetch(`${BASE_URL}/volunteer/tasks`, {
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    assert(a7.status === 403, "A7. Student accessing /api/volunteer/tasks returns 403");

    // 8. Student cannot create events
    const a8 = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Student Rogue Event" }),
    });
    assert(a8.status === 403, "A8. Student attempting to create event returns 403");

    // 9. Volunteer cannot access Admin user management
    const a9 = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${vol1Token}` },
    });
    assert(a9.status === 403, "A9. Volunteer accessing /api/admin/users returns 403");

    // 10. Volunteer cannot register as student for event
    const a10 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vol1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: new mongoose.Types.ObjectId() }),
    });
    assert(a10.status === 403, "A10. Volunteer attempting student registration returns 403");

    // 11. Admin cannot register as student for event
    const a11 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: new mongoose.Types.ObjectId() }),
    });
    assert(a11.status === 403, "A11. Admin attempting student registration returns 403");

    console.log("\n--- AUDIT 3: STUDENT & VOLUNTEER DATA ISOLATION ---");

    // Setup event for isolation testing
    const event = await Event.create({
      name: "Audit P10 Isolation Test Event",
      category: "Workshop",
      description: "Testing strict cross-user isolation",
      venue: "Lab 1",
      date: new Date(Date.now() + 86400000),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      registrationOpen: new Date(Date.now() - 3600000),
      registrationClose: new Date(Date.now() + 86400000),
      participantsLimit: 50,
      status: "published",
      createdBy: admin._id,
    });

    // Student 1 registers
    const regRes1 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: event._id }),
    });
    const regData1 = await regRes1.json();
    const regId1 = regData1.data?._id || regData1.data?.id;

    // 12. Student 2 cannot cancel Student 1's registration
    const a12 = await fetch(`${BASE_URL}/registrations/${regId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    assert(a12.status === 403, "A12. Student 2 cannot cancel Student 1's registration (403)");

    // Admin creates Task for Volunteer 1
    const taskRes1 = await fetch(`${BASE_URL}/volunteer/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Volunteer 1 Exclusive Task",
        eventId: event._id,
        assignedTo: volunteer1._id,
        priority: "medium",
      }),
    });
    const taskData1 = await taskRes1.json();
    const taskId1 = taskData1.data?._id;

    // 13. Volunteer 2 cannot modify Volunteer 1's assigned task
    const a13 = await fetch(`${BASE_URL}/volunteer/tasks/${taskId1}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${vol2Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "completed" }),
    });
    assert(a13.status === 403, "A13. Volunteer 2 cannot modify Volunteer 1's assigned task (403)");

    console.log("\n--- AUDIT 4: SENSITIVE DATA LEAK PREVENTION ---");

    // 14. /api/auth/me does not leak password hash
    const a14 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    const data14 = await a14.json();
    assert(
      a14.status === 200 && data14.user?.password === undefined,
      "A14. /api/auth/me does not expose password field"
    );

    // 15. /api/users/profile does not leak password hash
    const a15 = await fetch(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    const data15 = await a15.json();
    assert(
      a15.status === 200 && data15.data?.user?.password === undefined,
      "A15. /api/users/profile does not expose password field"
    );

    // 16. /api/admin/users does not leak password hashes
    const a16 = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data16 = await a16.json();
    assert(
      a16.status === 200 && data16.data.every((u) => u.password === undefined),
      "A16. /api/admin/users list does not expose password hashes"
    );

    console.log("\n--- AUDIT 5: REGISTRATION & CAPACITY ATOMIC INTEGRITY ---");

    // Create limited capacity event (limit: 1)
    const tightEvent = await Event.create({
      name: "Audit P10 Tight Capacity Event",
      category: "Workshop",
      description: "Testing strict capacity barrier",
      venue: "Lab 2",
      date: new Date(Date.now() + 86400000),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      registrationOpen: new Date(Date.now() - 3600000),
      registrationClose: new Date(Date.now() + 86400000),
      participantsLimit: 1,
      status: "published",
      createdBy: admin._id,
    });

    // Student 1 registers (fills capacity 1/1)
    const capRes1 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: tightEvent._id }),
    });
    assert(capRes1.status === 201, "A17. Student 1 registers filling event to 1/1 capacity (201)");

    // Student 2 tries to register (capacity full) -> 400
    const capRes2 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu2Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: tightEvent._id }),
    });
    assert(capRes2.status === 400, "A18. Student 2 rejected when event capacity is full (400)");

    // Verify registeredCount didn't overflow
    const tightEventDb = await Event.findById(tightEvent._id);
    assert(tightEventDb.registeredCount === 1, "A19. Event registeredCount is strictly preserved at 1 without overflow");

    console.log("\n--- AUDIT 6: ATTENDANCE & QR REUSE PREVENTION ---");

    // Student 1 cancels registration
    const regDataT = await capRes1.json();
    const regIdT = regDataT.data?._id || regDataT.data?.id;
    const cancelRes = await fetch(`${BASE_URL}/registrations/${regIdT}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    assert(cancelRes.status === 200, "A20. Student 1 cancels registration (200)");

    // Try scanning cancelled QR token
    const scanCancelledRes = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vol1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: regDataT.data?.qr?.token || "fake-token",
        eventId: tightEvent._id,
      }),
    });
    assert(scanCancelledRes.status === 400, "A21. QR token for cancelled registration is strictly rejected (400)");

    // Freed slot allows Student 2 to register
    const capRes3 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu2Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId: tightEvent._id }),
    });
    assert(capRes3.status === 201, "A22. Freed registration slot successfully utilized by Student 2 (201)");

    console.log("\n--- AUDIT 7: CERTIFICATE & FEEDBACK GATEKEEPING ---");

    // Volunteer marks attendance for Student 2
    const attRes = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vol1Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: tightEvent._id,
        studentId: student2._id,
      }),
    });
    assert(attRes.status === 200 || attRes.status === 201, "A23. Student 2 attendance marked present");

    // Try generating certificate when feedback is required but not yet submitted
    tightEvent.feedbackRequired = true;
    tightEvent.certificateAvailable = true;
    await tightEvent.save();

    // Check certificate eligibility before feedback
    const eligRes1 = await fetch(`${BASE_URL}/certificates/eligibility/${tightEvent._id}`, {
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    const eligData1 = await eligRes1.json();
    assert(
      eligData1.eligible === false && eligData1.reason?.toLowerCase().includes("feedback"),
      "A24. Certificate eligibility gates on feedback submission when required"
    );

    // Student 2 submits feedback
    const fbRes = await fetch(`${BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stu2Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId: tightEvent._id,
        overallRating: 5,
        contentRating: 5,
        speakerRating: 5,
        organizationRating: 5,
        comment: "Excellent workshop!",
        wouldRecommend: true,
      }),
    });
    assert(fbRes.status === 201, "A25. Student 2 submits mandatory feedback (201)");

    // Check certificate eligibility after feedback
    const eligRes2 = await fetch(`${BASE_URL}/certificates/eligibility/${tightEvent._id}`, {
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    const eligData2 = await eligRes2.json();
    assert(eligData2.eligible === true, "A26. Certificate eligibility unlocks immediately after feedback submission");

    // Generate certificate
    const genRes = await fetch(`${BASE_URL}/certificates/generate/${tightEvent._id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(genRes.status === 200 || genRes.status === 201, "A27. Admin generates certificate for verified attendee");

    // Public verification by code
    const certsRes = await fetch(`${BASE_URL}/certificates/my`, {
      headers: { Authorization: `Bearer ${stu2Token}` },
    });
    const certsData = await certsRes.json();
    const certCode = certsData.data?.[0]?.verificationCode || certsData.data?.[0]?.certificateId;

    if (certCode) {
      const verifyRes = await fetch(`${BASE_URL}/certificates/verify/${certCode}`);
      const verifyData = await verifyRes.json();
      assert(
        verifyRes.status === 200 && verifyData.success === true,
        "A28. Public certificate verification succeeds with valid unique verification code"
      );
    } else {
      assert(certsData.data?.length >= 1, "A28. Student retrieves generated certificate in /my certificates");
    }

  } catch (err) {
    console.error("Audit execution error:", err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log("\n================================================================");
  console.log(`Phase 10 Audit Tests Finished: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit();
