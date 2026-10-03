import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";
import StudentEventQR from "./models/StudentEventQR.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 4 COMPREHENSIVE TEST RUNNER       ");
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
    // 0. Clean up test artifacts
    await User.deleteMany({ email: { $regex: /@phase4test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE4 TEST\]/ } });

    // 1. Create Test Users: Student 1 (eligible), Student 2 (ineligible year), Student 3 (ineligible dept), Volunteer, Admin
    const student1 = await User.create({
      name: "Phase4 Student One",
      email: "student1@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4IT001",
      phone: "9876543211",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      year: 2,
      accountStatus: "active",
      emailVerified: true,
    });
    const token1 = generateToken(student1._id);

    const student2 = await User.create({
      name: "Phase4 Student Ineligible Year",
      email: "student2@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4IT002",
      phone: "9876543212",
      role: "student",
      department: "IT",
      batch: { startYear: 2026, endYear: 2030 },
      accountStatus: "active",
      emailVerified: true,
    });
    const token2 = generateToken(student2._id);

    const student3 = await User.create({
      name: "Phase4 Student Ineligible Dept",
      email: "student3@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4ME003",
      phone: "9876543213",
      role: "student",
      department: "Mechanical",
      batch: { startYear: 2024, endYear: 2028 },
      year: 2,
      accountStatus: "active",
      emailVerified: true,
    });
    const token3 = generateToken(student3._id);

    const volunteer = await User.create({
      name: "Phase4 Volunteer",
      email: "volunteer@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4VOL001",
      phone: "9876543214",
      role: "volunteer",
      department: "IT",
      batch: { startYear: 2023, endYear: 2027 },
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteer.jpg",
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenVol = generateToken(volunteer._id);

    const admin = await User.create({
      name: "Phase4 Admin",
      email: "admin@phase4test.com",
      password: "Password@123",
      phone: "9876543215",
      role: "admin",
      accountStatus: "active",
      emailVerified: true,
    });
    const tokenAdmin = generateToken(admin._id);

    // 2. Create Test Events
    const now = new Date();
    const futureDate = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
    const pastDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const regOpenPast = new Date(now.getTime() - 24 * 3600 * 1000);
    const regCloseFuture = new Date(now.getTime() + 2 * 24 * 3600 * 1000);
    const regClosePast = new Date(now.getTime() - 1 * 3600 * 1000);
    const regOpenFuture = new Date(now.getTime() + 24 * 3600 * 1000);

    const eventA = await Event.create({
      name: "[PHASE4 TEST] Open Event A",
      description: "Standard open event with capacity 2",
      date: new Date("2026-10-15"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Lab 1",
      category: "Workshop",
      participantsLimit: 2,
      registeredCount: 0,
      registration: {
        openAt: regOpenPast,
        closeAt: regCloseFuture,
      },
      status: "published",
      eligibility: {
        enabled: true,
        years: [2, 3],
        branchCodes: ["IT", "CE"],
      },
      createdBy: admin._id,
    });

    const eventExpired = await Event.create({
      name: "[PHASE4 TEST] Expired Reg Event",
      description: "Registration deadline has passed",
      date: new Date("2026-10-20"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Hall A",
      category: "Seminar",
      participantsLimit: 50,
      registeredCount: 0,
      registration: {
        openAt: pastDate,
        closeAt: regClosePast,
      },
      status: "published",
      createdBy: admin._id,
    });

    const eventFuture = await Event.create({
      name: "[PHASE4 TEST] Future Reg Event",
      description: "Registration has not opened yet",
      date: new Date("2026-10-25"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      venue: "Hall B",
      category: "Seminar",
      participantsLimit: 50,
      registeredCount: 0,
      registration: {
        openAt: regOpenFuture,
        closeAt: futureDate,
      },
      status: "published",
      createdBy: admin._id,
    });

    // -------------------------------------------------------------
    // TEST 1: Unauthenticated registration -> 401
    // -------------------------------------------------------------
    const res1 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res1.status === 401, "1. Unauthenticated registration rejected with 401");

    // -------------------------------------------------------------
    // TEST 2: Volunteer registration attempt -> 403
    // -------------------------------------------------------------
    const res2 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenVol}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res2.status === 403, "2. Volunteer registration rejected with 403 (role restriction)");

    // -------------------------------------------------------------
    // TEST 3: Admin registration attempt -> 403
    // -------------------------------------------------------------
    const res3 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res3.status === 403, "3. Admin registration rejected with 403 (role restriction)");

    // -------------------------------------------------------------
    // TEST 4: Event not found -> 404
    // -------------------------------------------------------------
    const res4 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ eventId: new mongoose.Types.ObjectId() }),
    });
    assert(res4.status === 404, "4. Non-existent event returns 404");

    // -------------------------------------------------------------
    // TEST 5: Registration before open -> 400
    // -------------------------------------------------------------
    const res5 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ eventId: eventFuture._id }),
    });
    assert(res5.status === 400, "5. Registration before window opens rejected with 400");

    // -------------------------------------------------------------
    // TEST 6: Registration after close -> 400
    // -------------------------------------------------------------
    const res6 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ eventId: eventExpired._id }),
    });
    assert(res6.status === 400, "6. Registration after window closes rejected with 400");

    // -------------------------------------------------------------
    // TEST 7: Ineligible year -> 400
    // -------------------------------------------------------------
    const res7 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token2}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res7.status === 400, "7. Ineligible academic year rejected with 400");

    // -------------------------------------------------------------
    // TEST 8: Ineligible department -> 400
    // -------------------------------------------------------------
    const res8 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token3}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res8.status === 400, "8. Ineligible department rejected with 400");

    // -------------------------------------------------------------
    // TEST 9: Student 1 registers successfully -> 201
    // -------------------------------------------------------------
    const res9 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    const data9 = await res9.json();
    assert(res9.status === 201 && data9.success, "9. Eligible student registers successfully (201)");
    const regId1 = data9.data?._id;

    // -------------------------------------------------------------
    // TEST 10: Event registeredCount incremented exactly once (0 -> 1)
    // -------------------------------------------------------------
    const updatedEvA = await Event.findById(eventA._id);
    assert(updatedEvA.registeredCount === 1, "10. Event registeredCount incremented to 1 in MongoDB");

    // -------------------------------------------------------------
    // TEST 11: StudentEventQR created and linked
    // -------------------------------------------------------------
    const qrDoc = await StudentEventQR.findOne({ registrationId: regId1 });
    assert(
      qrDoc && qrDoc.studentId.toString() === student1._id.toString() && qrDoc.active === true && qrDoc.token?.length > 0,
      "11. StudentEventQR document created with valid secure token"
    );

    // -------------------------------------------------------------
    // TEST 12: Duplicate registration attempt -> 400 / 409
    // -------------------------------------------------------------
    const res12 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token1}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res12.status === 400 || res12.status === 409, "12. Duplicate active registration rejected");

    // Check count didn't change on duplicate
    const evCheckDup = await Event.findById(eventA._id);
    assert(evCheckDup.registeredCount === 1, "13. Duplicate attempt did not increment registeredCount");

    // -------------------------------------------------------------
    // TEST 14: Capacity overflow prevention
    // Register another student to reach capacity (limit = 2)
    // -------------------------------------------------------------
    const student4 = await User.create({
      name: "Phase4 Student Four",
      email: "student4@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4IT004",
      phone: "9876543216",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      year: 2,
      accountStatus: "active",
      emailVerified: true,
    });
    const token4 = generateToken(student4._id);

    const res14 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token4}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res14.status === 201, "14. Second student registered (reaching capacity limit of 2)");

    const evCapFull = await Event.findById(eventA._id);
    assert(evCapFull.registeredCount === 2, "15. registeredCount reached limit (2)");

    // Attempt 3rd student registration -> capacity reached
    const student5 = await User.create({
      name: "Phase4 Student Five",
      email: "student5@phase4test.com",
      password: "Password@123",
      enrollmentNo: "P4IT005",
      phone: "9876543217",
      role: "student",
      department: "IT",
      batch: { startYear: 2024, endYear: 2028 },
      year: 2,
      accountStatus: "active",
      emailVerified: true,
    });
    const token5 = generateToken(student5._id);

    const res16 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token5}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res16.status === 400 || res16.status === 409, "16. 3rd registration rejected due to capacity limit");

    const evNoOverflow = await Event.findById(eventA._id);
    assert(evNoOverflow.registeredCount === 2, "17. registeredCount strictly preserved without overflow (2/2)");

    // -------------------------------------------------------------
    // TEST 18: Student fetches own registrations
    // -------------------------------------------------------------
    const res18 = await fetch(`${BASE_URL}/registrations/my`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    const data18 = await res18.json();
    const myEventId = data18.data?.[0]?.eventId?._id?.toString() || data18.data?.[0]?.eventId?.toString();
    assert(
      res18.status === 200 && data18.data?.length === 1 && myEventId === eventA._id.toString(),
      "18. Student retrieves own active registrations including event details"
    );

    // -------------------------------------------------------------
    // TEST 19: Unauthorized access / cross-student isolation
    // Student 2 tries to cancel Student 1's registration -> 403
    // -------------------------------------------------------------
    const res19 = await fetch(`${BASE_URL}/registrations/${regId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token2}` },
    });
    assert(res19.status === 403, "19. Student 2 cannot cancel Student 1's registration (403 Forbidden)");

    // -------------------------------------------------------------
    // TEST 20: Authorized Volunteer fetches event participant registrations
    // -------------------------------------------------------------
    const res20 = await fetch(`${BASE_URL}/registrations/event/${eventA._id}`, {
      headers: { Authorization: `Bearer ${tokenVol}` },
    });
    const data20 = await res20.json();
    assert(
      res20.status === 200 && data20.data?.length === 2,
      "20. Volunteer successfully fetches event participant registrations"
    );

    // -------------------------------------------------------------
    // TEST 21: Authorized Admin fetches all registrations
    // -------------------------------------------------------------
    const res21 = await fetch(`${BASE_URL}/registrations`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const data21 = await res21.json();
    assert(
      res21.status === 200 && data21.data?.length >= 2,
      "21. Admin successfully retrieves all system registrations"
    );

    // -------------------------------------------------------------
    // TEST 22: Student cancels own registration
    // -------------------------------------------------------------
    const res22 = await fetch(`${BASE_URL}/registrations/${regId1}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token1}` },
    });
    const data22 = await res22.json();
    assert(res22.status === 200 && data22.success, "22. Student cancels own registration (200)");

    // -------------------------------------------------------------
    // TEST 23: Cancellation updates count, status, and QR validity in MongoDB
    // -------------------------------------------------------------
    const evAfterCancel = await Event.findById(eventA._id);
    const regDocCancelled = await Registration.findById(regId1);
    const qrDocCancelled = await StudentEventQR.findOne({ registrationId: regId1 });

    assert(
      evAfterCancel.registeredCount === 1 &&
      regDocCancelled.status === "cancelled" &&
      regDocCancelled.isDeleted === true &&
      qrDocCancelled.active === false,
      "23. Cancellation decrements registeredCount (2->1), marks cancelled, and deactivates QR"
    );

    // -------------------------------------------------------------
    // TEST 24: Student 5 can now register in the freed capacity slot
    // -------------------------------------------------------------
    const res24 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token5}`,
      },
      body: JSON.stringify({ eventId: eventA._id }),
    });
    assert(res24.status === 201, "24. Slot freed by cancellation successfully allows new registration");

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@phase4test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE4 TEST\]/ } });
    await Registration.deleteMany({ eventId: { $in: [eventA._id, eventExpired._id, eventFuture._id] } });
    await StudentEventQR.deleteMany({ eventId: { $in: [eventA._id, eventExpired._id, eventFuture._id] } });

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("====================================================");
    console.log(`TESTS SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("====================================================");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
