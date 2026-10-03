import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";
import StudentEventQR from "./models/StudentEventQR.js";
import Attendance from "./models/Attendance.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5056;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 5 COMPREHENSIVE TEST RUNNER       ");
  console.log("====================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  // Setup express server for testing
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/registrations", registrationRoutes);
  app.use("/api/attendance", attendanceRoutes);

  app.use(notFound);
  app.use(errorHandler);

  const server = app.listen(TEST_PORT);
  console.log(`Test server running on port ${TEST_PORT}`);

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
    // 0. Clean up previous test artifacts
    await User.deleteMany({ email: { $regex: /@phase5test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE5 TEST\]/ } });
    await Registration.deleteMany({ cancellationReason: "Phase5 test cleanup" });

    // 1. Create Test Users: Student 1, Student 2, Volunteer, Admin
    const student1 = await User.create({
      name: "Phase5 Student One",
      email: "student1@phase5test.com",
      password: "Password@123",
      enrollmentNo: "P5IT001",
      phone: "9876543221",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenStudent1 = generateToken(student1._id);

    const student2 = await User.create({
      name: "Phase5 Student Two",
      email: "student2@phase5test.com",
      password: "Password@123",
      enrollmentNo: "P5IT002",
      phone: "9876543222",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenStudent2 = generateToken(student2._id);

    const student3 = await User.create({
      name: "Phase5 Student Three",
      email: "student3@phase5test.com",
      password: "Password@123",
      enrollmentNo: "P5IT003",
      phone: "9876543223",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenStudent3 = generateToken(student3._id);

    const volunteer = await User.create({
      name: "Phase5 Volunteer",
      email: "volunteer@phase5test.com",
      password: "Password@123",
      enrollmentNo: "P5VOL001",
      phone: "9876543224",
      role: "volunteer",
      department: "IT",
      batch: { startYear: 2023, endYear: 2027 },
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteer.jpg",
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenVolunteer = generateToken(volunteer._id);

    const admin = await User.create({
      name: "Phase5 Admin",
      email: "admin@phase5test.com",
      password: "Password@123",
      phone: "9876543225",
      role: "admin",
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenAdmin = generateToken(admin._id);

    // 2. Create Test Events
    const now = new Date();
    const openPast = new Date(now.getTime() - 2 * 3600 * 1000);
    const closeFuture = new Date(now.getTime() + 4 * 3600 * 1000);
    const closePast = new Date(now.getTime() - 1 * 3600 * 1000);
    const openFuture = new Date(now.getTime() + 2 * 3600 * 1000);

    // Event A: Active event with attendance open right now
    const eventA = await Event.create({
      name: "[PHASE5 TEST] Open Attendance Event",
      description: "Event with attendance window active now",
      date: new Date("2026-10-15"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Main Audi",
      category: "Workshop",
      participantsLimit: 50,
      registeredCount: 3,
      status: "published",
      registration: {
        openAt: openPast,
        closeAt: closeFuture,
      },
      attendance: {
        openAt: openPast,
        closeAt: closeFuture,
      },
      createdBy: admin._id,
    });

    // Event Window Future: Attendance not open yet
    const eventFuture = await Event.create({
      name: "[PHASE5 TEST] Future Attendance Event",
      description: "Attendance window opens tomorrow",
      date: new Date("2026-10-25"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Hall B",
      category: "Seminar",
      participantsLimit: 50,
      registeredCount: 1,
      status: "published",
      registration: {
        openAt: openPast,
        closeAt: closeFuture,
      },
      attendance: {
        openAt: openFuture,
        closeAt: new Date(openFuture.getTime() + 4 * 3600 * 1000),
      },
      createdBy: admin._id,
    });

    // Event Window Past: Attendance closed
    const eventClosed = await Event.create({
      name: "[PHASE5 TEST] Closed Attendance Event",
      description: "Attendance window closed an hour ago",
      date: new Date("2026-10-10"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Hall A",
      category: "Seminar",
      participantsLimit: 50,
      registeredCount: 1,
      status: "published",
      registration: {
        openAt: openPast,
        closeAt: closeFuture,
      },
      attendance: {
        openAt: new Date(now.getTime() - 5 * 3600 * 1000),
        closeAt: closePast,
      },
      createdBy: admin._id,
    });

    // 3. Create Registrations & QR Codes
    // Registration 1: Student 1 for Event A (Active)
    const reg1 = await Registration.create({
      studentId: student1._id,
      eventId: eventA._id,
      registeredAt: now,
      status: "registered",
      isDeleted: false,
    });
    const qrToken1 = "TOKEN_VALID_STUDENT1_EVENTA_" + crypto.randomBytes(8).toString("hex");
    const qr1 = await StudentEventQR.create({
      studentId: student1._id,
      eventId: eventA._id,
      registrationId: reg1._id,
      token: qrToken1,
      expiresAt: closeFuture,
      active: true,
    });

    // Registration 2: Student 2 for Event A (Active)
    const reg2 = await Registration.create({
      studentId: student2._id,
      eventId: eventA._id,
      registeredAt: now,
      status: "registered",
      isDeleted: false,
    });
    const qrToken2 = "TOKEN_VALID_STUDENT2_EVENTA_" + crypto.randomBytes(8).toString("hex");
    const qr2 = await StudentEventQR.create({
      studentId: student2._id,
      eventId: eventA._id,
      registrationId: reg2._id,
      token: qrToken2,
      expiresAt: closeFuture,
      active: true,
    });

    // Registration 3: Student 3 for Event A (Active, but QR inactive/expired test)
    const reg3 = await Registration.create({
      studentId: student3._id,
      eventId: eventA._id,
      registeredAt: now,
      status: "registered",
      isDeleted: false,
    });
    const qrTokenInactive = "TOKEN_INACTIVE_" + crypto.randomBytes(8).toString("hex");
    await StudentEventQR.create({
      studentId: student3._id,
      eventId: eventA._id,
      registrationId: reg3._id,
      token: qrTokenInactive,
      expiresAt: closeFuture,
      active: false,
    });

    const qrTokenExpired = "TOKEN_EXPIRED_" + crypto.randomBytes(8).toString("hex");
    await StudentEventQR.create({
      studentId: student3._id,
      eventId: eventA._id,
      registrationId: reg3._id,
      token: qrTokenExpired,
      expiresAt: new Date(now.getTime() - 10 * 3600 * 1000), // expired 10 hours ago
      active: true,
    });

    // Registration for Cancelled Event Test
    const regCancelled = await Registration.create({
      studentId: student1._id,
      eventId: eventA._id,
      registeredAt: now,
      status: "cancelled",
      isDeleted: true,
      cancellationReason: "Phase5 test cleanup",
    });
    const qrTokenCancelled = "TOKEN_CANCELLED_" + crypto.randomBytes(8).toString("hex");
    await StudentEventQR.create({
      studentId: student1._id,
      eventId: eventA._id,
      registrationId: regCancelled._id,
      token: qrTokenCancelled,
      expiresAt: closeFuture,
      active: true,
    });

    // Registration for Future Attendance Event
    const regFuture = await Registration.create({
      studentId: student1._id,
      eventId: eventFuture._id,
      registeredAt: now,
      status: "registered",
      isDeleted: false,
    });
    const qrTokenFuture = "TOKEN_FUTURE_" + crypto.randomBytes(8).toString("hex");
    await StudentEventQR.create({
      studentId: student1._id,
      eventId: eventFuture._id,
      registrationId: regFuture._id,
      token: qrTokenFuture,
      expiresAt: new Date(now.getTime() + 48 * 3600 * 1000),
      active: true,
    });

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated QR scan rejected -> 401
    // -------------------------------------------------------------
    const res1 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: qrToken1 }),
    });
    assert(res1.status === 401, "1. Unauthenticated QR scan attempt rejected with 401");

    // -------------------------------------------------------------
    // TEST 2: Unauthenticated manual attendance rejected -> 401
    // -------------------------------------------------------------
    const res2 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student1._id, eventId: eventA._id }),
    });
    assert(res2.status === 401, "2. Unauthenticated manual attendance attempt rejected with 401");

    // -------------------------------------------------------------
    // TEST 3: Student cannot scan QR -> 403 Forbidden
    // -------------------------------------------------------------
    const res3 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenStudent1}`,
      },
      body: JSON.stringify({ token: qrToken1 }),
    });
    assert(res3.status === 403, "3. Student cannot scan QR (403 Forbidden)");

    // -------------------------------------------------------------
    // TEST 4: Student cannot manually mark attendance -> 403 Forbidden
    // -------------------------------------------------------------
    const res4 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenStudent1}`,
      },
      body: JSON.stringify({ studentId: student1._id, eventId: eventA._id }),
    });
    assert(res4.status === 403, "4. Student cannot manually mark attendance (403 Forbidden)");

    // -------------------------------------------------------------
    // TEST 5: Invalid / Malformed QR token rejected -> 404 / 400
    // -------------------------------------------------------------
    const res5 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: "NON_EXISTENT_QR_TOKEN_123" }),
    });
    assert(res5.status === 404 || res5.status === 400, "5. Invalid / unrecognized QR token rejected");

    // -------------------------------------------------------------
    // TEST 6: Inactive QR token rejected -> 400
    // -------------------------------------------------------------
    const res6 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrTokenInactive }),
    });
    assert(res6.status === 400, "6. Inactive / revoked QR token rejected with 400");

    // -------------------------------------------------------------
    // TEST 7: Expired QR token rejected -> 400
    // -------------------------------------------------------------
    const res7 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrTokenExpired }),
    });
    assert(res7.status === 400, "7. Expired QR token rejected with 400");

    // -------------------------------------------------------------
    // TEST 8: QR for cancelled registration rejected -> 400
    // -------------------------------------------------------------
    const res8 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrTokenCancelled }),
    });
    assert(res8.status === 400, "8. QR for cancelled registration rejected with 400");

    // -------------------------------------------------------------
    // TEST 9: Attendance before window opens rejected -> 400
    // -------------------------------------------------------------
    const res9 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrTokenFuture }),
    });
    assert(res9.status === 400, "9. Attendance before window opens rejected with 400");

    // -------------------------------------------------------------
    // TEST 10: Volunteer successfully scans valid QR (Student 1) -> 201 Created
    // -------------------------------------------------------------
    const res10 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrToken1 }),
    });
    const data10 = await res10.json();
    assert(
      res10.status === 201 && data10.success && data10.data?.attendance?.status === "present",
      "10. Volunteer successfully scans valid QR for Student 1 (201 Created)"
    );
    const attId1 = data10.data?.attendance?._id;

    // -------------------------------------------------------------
    // TEST 11: MongoDB Attendance record created with correct fields
    // -------------------------------------------------------------
    const attDoc1 = await Attendance.findById(attId1);
    assert(
      attDoc1 &&
      attDoc1.studentId.toString() === student1._id.toString() &&
      attDoc1.eventId.toString() === eventA._id.toString() &&
      attDoc1.markedBy.toString() === volunteer._id.toString() &&
      attDoc1.method === "qr" &&
      attDoc1.status === "present",
      "11. Attendance document verified in MongoDB with correct student, event, marker, and method 'qr'"
    );

    // -------------------------------------------------------------
    // TEST 12: Duplicate QR scan handled cleanly (returns duplicate: true, no extra record)
    // -------------------------------------------------------------
    const res12 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ token: qrToken1 }),
    });
    const data12 = await res12.json();
    const countAfterDup = await Attendance.countDocuments({ studentId: student1._id, eventId: eventA._id, isDeleted: false });
    assert(
      res12.status === 200 && data12.duplicate === true && countAfterDup === 1,
      "12. Duplicate QR scan returns safe duplicate notice and preserves exactly 1 attendance record"
    );

    // -------------------------------------------------------------
    // TEST 13: Admin successfully scans valid QR (Student 2) -> 201 Created
    // -------------------------------------------------------------
    const res13 = await fetch(`${BASE_URL}/attendance/scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ token: qrToken2 }),
    });
    const data13 = await res13.json();
    assert(
      res13.status === 201 && data13.data?.attendance?.markedBy?.toString() === admin._id.toString(),
      "13. Admin successfully scans QR for Student 2 with markedBy: admin._id"
    );

    // -------------------------------------------------------------
    // TEST 14: Manual attendance on unregistered student fails -> 400
    // -------------------------------------------------------------
    const unregisteredStudent = await User.create({
      name: "Phase5 Unregistered Student",
      email: "unregistered@phase5test.com",
      password: "Password@123",
      enrollmentNo: "P5UNREG99",
      phone: "9876543299",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      accountStatus: "active",
      emailVerified: true,
    });

    const res14 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ studentId: unregisteredStudent._id, eventId: eventA._id }),
    });
    assert(res14.status === 400, "14. Manual attendance for unregistered student rejected with 400");

    // -------------------------------------------------------------
    // TEST 15: Volunteer manually marks attendance for registered Student 3 -> 201 Created
    // -------------------------------------------------------------
    const res15 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ studentId: student3._id, eventId: eventA._id }),
    });
    const data15 = await res15.json();
    assert(
      res15.status === 201 && data15.data?.attendance?.method === "manual",
      "15. Volunteer manually marks attendance for registered student with method: 'manual'"
    );

    // -------------------------------------------------------------
    // TEST 16: Duplicate manual attendance returns safe duplicate notice
    // -------------------------------------------------------------
    const res16 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVolunteer}`,
      },
      body: JSON.stringify({ studentId: student3._id, eventId: eventA._id }),
    });
    const data16 = await res16.json();
    const countStudent3 = await Attendance.countDocuments({ studentId: student3._id, eventId: eventA._id, isDeleted: false });
    assert(
      res16.status === 200 && data16.duplicate === true && countStudent3 === 1,
      "16. Duplicate manual attendance attempt safely rejected without duplicating record"
    );

    // -------------------------------------------------------------
    // TEST 17: Manual attendance by enrollment number succeeds -> 200 / 201
    // -------------------------------------------------------------
    const res17 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ enrollmentNo: "P5IT001", eventId: eventA._id }),
    });
    const data17 = await res17.json();
    assert(
      res17.status === 200 && data17.duplicate === true,
      "17. Manual attendance by enrollment number recognizes existing attendance"
    );

    // -------------------------------------------------------------
    // TEST 18: Student retrieves own attendance records (GET /api/attendance/my)
    // -------------------------------------------------------------
    const res18 = await fetch(`${BASE_URL}/attendance/my`, {
      headers: { Authorization: `Bearer ${tokenStudent1}` },
    });
    const data18 = await res18.json();
    assert(
      res18.status === 200 && data18.data?.length === 1 && data18.data[0].eventId?.name === eventA.name,
      "18. Student retrieves own attendance records with populated event details"
    );

    // -------------------------------------------------------------
    // TEST 19: Student cannot view another student's attendance by ID -> 403 Forbidden
    // -------------------------------------------------------------
    const res19 = await fetch(`${BASE_URL}/attendance/${data13.data?.attendance?._id}`, {
      headers: { Authorization: `Bearer ${tokenStudent1}` },
    });
    assert(res19.status === 403, "19. Student 1 cannot view Student 2's attendance record (403 Forbidden)");

    // -------------------------------------------------------------
    // TEST 20: Volunteer retrieves event attendance (GET /api/attendance/event/:id)
    // -------------------------------------------------------------
    const res20 = await fetch(`${BASE_URL}/attendance/event/${eventA._id}`, {
      headers: { Authorization: `Bearer ${tokenVolunteer}` },
    });
    const data20 = await res20.json();
    assert(
      res20.status === 200 && data20.data?.length === 3,
      "20. Volunteer retrieves complete event attendance list (3 present students)"
    );

    // -------------------------------------------------------------
    // TEST 21: Admin retrieves event attendance (GET /api/attendance/event/:id)
    // -------------------------------------------------------------
    const res21 = await fetch(`${BASE_URL}/attendance/event/${eventA._id}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data21 = await res21.json();
    assert(
      res21.status === 200 && data21.data?.length === 3,
      "21. Admin retrieves complete event attendance list (3 present students)"
    );

    // -------------------------------------------------------------
    // TEST 22: Admin retrieves all system attendance (GET /api/attendance)
    // -------------------------------------------------------------
    const res22 = await fetch(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data22 = await res22.json();
    assert(
      res22.status === 200 && data22.data?.length >= 3,
      "22. Admin retrieves system-wide attendance records"
    );

    // -------------------------------------------------------------
    // TEST 23: Student attempting GET /api/attendance (admin only) -> 403 Forbidden
    // -------------------------------------------------------------
    const res23 = await fetch(`${BASE_URL}/attendance`, {
      headers: { Authorization: `Bearer ${tokenStudent1}` },
    });
    assert(res23.status === 403, "23. Student accessing system-wide attendance rejected (403 Forbidden)");

    // -------------------------------------------------------------
    // TEST 24: Unique MongoDB Index verification
    // Direct attempt to insert duplicate active attendance fails
    // -------------------------------------------------------------
    let duplicateIndexCaught = false;
    try {
      await Attendance.create({
        studentId: student1._id,
        eventId: eventA._id,
        registrationId: reg1._id,
        attendanceTime: new Date(),
        markedBy: volunteer._id,
        method: "qr",
        status: "present",
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateIndexCaught = true;
      }
    }
    assert(
      duplicateIndexCaught,
      "24. Unique compound index { studentId: 1, eventId: 1 } strictly prevents duplicate attendance in MongoDB"
    );

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@phase5test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE5 TEST\]/ } });
    await Registration.deleteMany({ eventId: { $in: [eventA._id, eventFuture._id, eventClosed._id] } });
    await StudentEventQR.deleteMany({ eventId: { $in: [eventA._id, eventFuture._id, eventClosed._id] } });
    await Attendance.deleteMany({ eventId: { $in: [eventA._id, eventFuture._id, eventClosed._id] } });

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("====================================================");
    console.log(`PHASE 5 TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("====================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
