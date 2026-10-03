import mongoose from "mongoose";
import express from "express";
import cors from "cors";
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
import AboutTCF from "./models/AboutTCF.js";
import GlobalSettings from "./models/GlobalSettings.js";
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
const TEST_PORT = 5099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 9 COMPREHENSIVE TEST RUNNER       ");
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
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/certificates", certificateRoutes);
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/learning", learningRoutes);
  app.use("/api/volunteer", volunteerRoutes);
  app.use("/api/admin", adminRoutes);

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
    // ----------------------------------------------------------------
    // Setup test users: Admin, Volunteer, Student
    // ----------------------------------------------------------------
    await User.deleteMany({ email: /test_phase9_/ });
    await Event.deleteMany({ name: /Phase 9 Test/ });
    await Gallery.deleteMany({ title: /Phase 9 Test/ });
    await LearningResource.deleteMany({ title: /Phase 9 Test/ });

    const adminUser = await User.create({
      fullName: "Phase 9 Admin",
      email: "test_phase9_admin@axon.edu",
      password: "password123",
      role: "admin",
      enrollmentNumber: "ADM999999",
      department: "Information Technology",
      phoneNumber: "9876543210",
      batch: { startYear: 2022, endYear: 2026 },
      semester: 8,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/admin.jpg",
    });

    const studentUser = await User.create({
      fullName: "Phase 9 Student",
      email: "test_phase9_student@axon.edu",
      password: "password123",
      role: "student",
      enrollmentNumber: "STU999991",
      department: "Information Technology",
      phoneNumber: "9876543211",
      batch: { startYear: 2023, endYear: 2027 },
      semester: 4,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/student.jpg",
    });

    const dummyPositionId = new mongoose.Types.ObjectId();

    const volunteerUser = await User.create({
      fullName: "Phase 9 Volunteer",
      email: "test_phase9_volunteer@axon.edu",
      password: "password123",
      role: "volunteer",
      enrollmentNumber: "VOL999992",
      department: "Computer Engineering",
      phoneNumber: "9876543212",
      batch: { startYear: 2022, endYear: 2026 },
      semester: 6,
      accountStatus: "active",
      isEmailVerified: true,
      profilePhoto: "https://example.com/volunteer.jpg",
      committeePosition: dummyPositionId,
      workingUnder: adminUser._id,
    });

    const adminToken = generateToken(adminUser._id);
    const studentToken = generateToken(studentUser._id);
    const volunteerToken = generateToken(volunteerUser._id);

    console.log("\n--- PART 1: RBAC & SECURITY PROTECTION ---");

    // Test 1: Unauthenticated access to admin dashboard stats -> 401
    const res1 = await fetch(`${BASE_URL}/admin/dashboard-stats`);
    assert(res1.status === 401, "1. Unauthenticated request to /api/admin/dashboard-stats returns 401");

    // Test 2: Student token accessing admin dashboard stats -> 403
    const res2 = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res2.status === 403, "2. Student accessing /api/admin/dashboard-stats returns 403 Forbidden");

    // Test 3: Volunteer token accessing admin dashboard stats -> 403
    const res3 = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    assert(res3.status === 403, "3. Volunteer accessing /api/admin/dashboard-stats returns 403 Forbidden");

    // Test 4: Admin token accessing admin dashboard stats -> 200
    const res4 = await fetch(`${BASE_URL}/admin/dashboard-stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data4 = await res4.json();
    assert(
      res4.status === 200 &&
      data4.success === true &&
      data4.data.totalStudents >= 1 &&
      data4.data.totalVolunteers >= 1,
      "4. Admin retrieves live dashboard stats from MongoDB (200)"
    );

    console.log("\n--- PART 2: ADMIN USER MANAGEMENT ---");

    // Test 5: Admin creates volunteer account via POST /api/admin/volunteers
    const res5 = await fetch(`${BASE_URL}/admin/volunteers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Created Volunteer 9",
        email: "test_phase9_created_vol@axon.edu",
        password: "securePassword123",
        enrollmentNumber: "VOL999993",
        department: "Information Technology",
        semester: 6,
      }),
    });
    const data5 = await res5.json();
    const createdVolId = data5.data?._id;
    assert(
      res5.status === 201 && data5.success === true && data5.data?.role === "volunteer",
      "5. Admin successfully creates verified volunteer account (201)"
    );

    // Test 6: Duplicate volunteer email rejected
    const res6 = await fetch(`${BASE_URL}/admin/volunteers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Duplicate Volunteer",
        email: "test_phase9_created_vol@axon.edu",
        password: "securePassword123",
        enrollmentNumber: "VOL999994",
        department: "Information Technology",
        semester: 6,
      }),
    });
    assert(res6.status === 400, "6. Duplicate volunteer email rejected with 400");

    // Test 7: Duplicate volunteer enrollment number rejected
    const res7 = await fetch(`${BASE_URL}/admin/volunteers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: "Duplicate Enrollment Volunteer",
        email: "test_phase9_diff_email@axon.edu",
        password: "securePassword123",
        enrollmentNumber: "VOL999993",
        department: "Information Technology",
        semester: 6,
      }),
    });
    assert(res7.status === 400, "7. Duplicate volunteer enrollment number rejected with 400");

    // Test 8: Admin retrieves users list with role filter
    const res8 = await fetch(`${BASE_URL}/admin/users?role=volunteer`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data8 = await res8.json();
    assert(
      res8.status === 200 &&
      Array.isArray(data8.data) &&
      data8.data.every((u) => u.role === "volunteer"),
      "8. Admin retrieves users filtered by role=volunteer (200)"
    );

    // Test 9: Password hash is excluded in user queries
    assert(
      data8.data.every((u) => u.password === undefined),
      "9. Password hashes are strictly excluded from user list API responses"
    );

    // Test 10: Admin retrieves specific user by ID
    const res10 = await fetch(`${BASE_URL}/admin/users/${createdVolId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data10 = await res10.json();
    assert(
      res10.status === 200 &&
      data10.data?.email === "test_phase9_created_vol@axon.edu" &&
      data10.data?.password === undefined,
      "10. Admin retrieves user details by ID with sensitive fields omitted (200)"
    );

    // Test 11: Admin updates user status (active -> suspended)
    const res11 = await fetch(`${BASE_URL}/admin/users/${createdVolId}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountStatus: "suspended" }),
    });
    const data11 = await res11.json();
    assert(
      res11.status === 200 && data11.data?.accountStatus === "suspended",
      "11. Admin suspends volunteer account status (200)"
    );

    // Test 12: Admin cannot suspend self
    const res12 = await fetch(`${BASE_URL}/admin/users/${adminUser._id}/status`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountStatus: "suspended" }),
    });
    assert(res12.status === 400, "12. Admin cannot suspend their own admin account (400)");

    // Test 13: Admin soft-deletes user
    const res13 = await fetch(`${BASE_URL}/admin/users/${createdVolId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res13.status === 200, "13. Admin soft-deletes user account (200)");

    // Test 14: Admin cannot delete self
    const res14 = await fetch(`${BASE_URL}/admin/users/${adminUser._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res14.status === 400, "14. Admin cannot delete their own admin account (400)");

    console.log("\n--- PART 3: SYSTEM ANALYSIS, ABOUT TCF & SETTINGS ---");

    // Test 15: Admin retrieves system analysis & event performance
    const res15 = await fetch(`${BASE_URL}/admin/analysis`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data15 = await res15.json();
    assert(
      res15.status === 200 &&
      data15.success === true &&
      typeof data15.data.totalEvents === "number" &&
      typeof data15.data.categoryBreakdown === "object",
      "15. Admin retrieves comprehensive system analysis metrics (200)"
    );

    // Test 16: Public/authenticated retrieves About TCF content
    const res16 = await fetch(`${BASE_URL}/admin/about`);
    const data16 = await res16.json();
    assert(
      res16.status === 200 &&
      data16.success === true &&
      data16.data.vision !== undefined,
      "16. Retrieve About TCF information (200)"
    );

    // Test 17: Admin updates About TCF content
    const res17 = await fetch(`${BASE_URL}/admin/about`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vision: "Empowering Next-Gen Cyber Leaders at VGEC.",
        mission: "Excellence in cybersecurity education and ethical hacking.",
      }),
    });
    const data17 = await res17.json();
    assert(
      res17.status === 200 &&
      data17.data.vision === "Empowering Next-Gen Cyber Leaders at VGEC.",
      "17. Admin updates About TCF content (200)"
    );

    // Test 18: Student cannot update About TCF content -> 403
    const res18 = await fetch(`${BASE_URL}/admin/about`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vision: "Hacked Vision" }),
    });
    assert(res18.status === 403, "18. Student cannot modify About TCF content (403 Forbidden)");

    // Test 19: Admin retrieves global settings
    const res19 = await fetch(`${BASE_URL}/admin/settings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data19 = await res19.json();
    assert(
      res19.status === 200 && data19.data?.registration?.publicStudentRegistration !== undefined,
      "19. Admin retrieves global platform settings (200)"
    );

    // Test 20: Admin updates global settings
    const res20 = await fetch(`${BASE_URL}/admin/settings`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registration: {
          publicStudentRegistration: true,
          allowRegistrationReopen: true,
        },
      }),
    });
    const data20 = await res20.json();
    assert(
      res20.status === 200 && data20.data.registration.publicStudentRegistration === true,
      "20. Admin updates global system settings (200)"
    );

    console.log("\n--- PART 4: CROSS-MODULE CONSISTENCY & FLOW INTEGRATION ---");

    // Test 21: Admin creates Event -> Student sees same Event
    const res21 = await fetch(`${BASE_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Phase 9 Test Cyber Defense Summit",
        category: "Workshop",
        description: "Official workshop created by Admin in Phase 9",
        venue: "Auditorium VGEC",
        date: new Date(Date.now() + 86400000).toISOString(),
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        registrationOpen: new Date(Date.now() - 3600000).toISOString(),
        registrationClose: new Date(Date.now() + 86400000).toISOString(),
        participantsLimit: 50,
        status: "published",
      }),
    });
    const data21 = await res21.json();
    const eventId = data21.data?._id || data21.data?.id;
    assert(
      res21.status === 201 && eventId !== undefined,
      "21. Admin creates event (201)"
    );

    const res22 = await fetch(`${BASE_URL}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data22 = await res22.json();
    assert(
      res22.status === 200 && data22.data?.name === "Phase 9 Test Cyber Defense Summit",
      "22. Student retrieves the identical event created by Admin (200)"
    );

    // Test 23: Student registers for event -> Admin sees same registration
    const res23 = await fetch(`${BASE_URL}/registrations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventId }),
    });
    const data23 = await res23.json();
    assert(
      res23.status === 201 && data23.success === true,
      "23. Student successfully registers for Admin-created event (201)"
    );

    const res24 = await fetch(`${BASE_URL}/registrations/event/${eventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data24 = await res24.json();
    assert(
      res24.status === 200 &&
      Array.isArray(data24.data) &&
      data24.data.some((r) => String(r.student?.id) === String(studentUser._id) || String(r.student?._id) === String(studentUser._id)),
      "24. Admin sees student registration in event participants list (200)"
    );

    // Test 25: Volunteer marks attendance -> Admin sees attendance record
    const res25 = await fetch(`${BASE_URL}/attendance/manual`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${volunteerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        studentId: studentUser._id,
      }),
    });
    assert(
      res25.status === 200 || res25.status === 201,
      "25. Volunteer marks student attendance (200/201)"
    );

    const res26 = await fetch(`${BASE_URL}/attendance/event/${eventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data26 = await res26.json();
    assert(
      res26.status === 200 &&
      data26.data.some((a) => (a.studentId?._id || a.studentId) == studentUser._id && a.status === "present"),
      "26. Admin sees marked attendance record in real-time MongoDB data (200)"
    );

    // Test 27: Student submits Feedback -> Admin views feedback
    const res27 = await fetch(`${BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventId,
        overallRating: 5,
        contentRating: 5,
        speakerRating: 5,
        organizationRating: 5,
        comment: "Outstanding workshop arranged by Admin and Volunteers!",
        wouldRecommend: true,
      }),
    });
    assert(
      res27.status === 201,
      "27. Student submits feedback for completed event (201)"
    );

    const res28 = await fetch(`${BASE_URL}/feedback/event/${eventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data28 = await res28.json();
    assert(
      res28.status === 200 &&
      data28.data?.length >= 1,
      "28. Admin inspects event feedback summary and student reviews (200)"
    );

    // Test 29: Admin generates certificates -> Student receives certificate
    const res29 = await fetch(`${BASE_URL}/certificates/generate/${eventId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(
      res29.status === 200 || res29.status === 201,
      "29. Admin generates certificates for eligible attendees (200/201)"
    );

    const res30 = await fetch(`${BASE_URL}/certificates/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data30 = await res30.json();
    assert(
      res30.status === 200 &&
      data30.data.some((c) => (c.eventId?._id || c.eventId) == eventId),
      "30. Student retrieves certificate issued by Admin in their portal (200)"
    );

    // Test 31: Admin assigns task to Volunteer -> Volunteer retrieves assigned task
    const res31 = await fetch(`${BASE_URL}/volunteer/tasks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Setup Networking Equipment",
        description: "Configure routers and switches in Lab 3",
        eventId,
        assignedTo: volunteerUser._id,
        priority: "high",
      }),
    });
    const data31 = await res31.json();
    const taskId = data31.data?._id;
    assert(
      res31.status === 201 && taskId !== undefined,
      "31. Admin assigns operational task to volunteer (201)"
    );

    const res32 = await fetch(`${BASE_URL}/volunteer/tasks`, {
      headers: { Authorization: `Bearer ${volunteerToken}` },
    });
    const data32 = await res32.json();
    assert(
      res32.status === 200 &&
      data32.data.some((t) => t._id == taskId),
      "32. Assigned volunteer views the task assigned by Admin in /tasks (200)"
    );

    // Test 33: Volunteer completes task -> Admin sees updated status
    const res33 = await fetch(`${BASE_URL}/volunteer/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${volunteerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "completed",
        completed: true,
      }),
    });
    assert(res33.status === 200, "33. Volunteer completes task (200)");

    const res34 = await fetch(`${BASE_URL}/volunteer/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data34 = await res34.json();
    assert(
      res34.status === 200 &&
      (data34.data.status === "completed" || data34.data.completed === true),
      "34. Admin views updated completed task status (200)"
    );

    // Test 35: Admin creates Gallery media -> Student views media
    const res35 = await fetch(`${BASE_URL}/gallery`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: "Phase 9 Test Opening Session",
        banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        description: "Opening ceremony highlights",
        eventId,
      }),
    });
    const data35 = await res35.json();
    const galleryId = data35.data?._id;
    assert(
      res35.status === 201 && galleryId !== undefined,
      "35. Admin uploads gallery photo for event (201)"
    );

    const res36 = await fetch(`${BASE_URL}/gallery`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data36 = await res36.json();
    assert(
      res36.status === 200 &&
      data36.data.some((g) => g._id == galleryId),
      "36. Student views newly added gallery media (200)"
    );

    // Test 37: Admin creates Learning Resource -> Student views resource
    const res37 = await fetch(`${BASE_URL}/learning`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Phase 9 Test Web Security Cheatsheet",
        category: "tool",
        contentType: "external-link",
        description: "Essential OWASP Top 10 mitigation guide",
        externalUrl: "https://owasp.org/top-10/",
        isFeatured: true,
      }),
    });
    const data37 = await res37.json();
    const learningId = data37.data?._id;
    assert(
      res37.status === 201 && learningId !== undefined,
      "37. Admin creates learning hub resource (201)"
    );

    const res38 = await fetch(`${BASE_URL}/learning`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data38 = await res38.json();
    assert(
      res38.status === 200 &&
      data38.data.some((l) => l._id == learningId),
      "38. Student accesses learning resource published by Admin (200)"
    );

    // Test 39: Admin soft-deletes Gallery item -> Student no longer retrieves it
    const res39 = await fetch(`${BASE_URL}/gallery/${galleryId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res39.status === 200, "39. Admin soft-deletes gallery photo (200)");

    const res40 = await fetch(`${BASE_URL}/gallery`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data40 = await res40.json();
    assert(
      res40.status === 200 &&
      !data40.data.some((g) => g._id == galleryId),
      "40. Soft-deleted gallery item is excluded from student views (200)"
    );

    // Test 41: Admin soft-deletes Learning Resource -> Student no longer retrieves it
    const res41 = await fetch(`${BASE_URL}/learning/${learningId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res41.status === 200, "41. Admin soft-deletes learning resource (200)");

    const res42 = await fetch(`${BASE_URL}/learning`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data42 = await res42.json();
    assert(
      res42.status === 200 &&
      !data42.data.some((l) => l._id == learningId),
      "42. Soft-deleted learning resource is excluded from student hub (200)"
    );

    // Test 43: Admin soft-deletes Event -> Student no longer retrieves it
    const res43 = await fetch(`${BASE_URL}/events/${eventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res43.status === 200, "43. Admin soft-deletes event (200)");

    const res44 = await fetch(`${BASE_URL}/events/${eventId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(res44.status === 404, "44. Soft-deleted event returns 404 for student lookup");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log("\n====================================================");
  console.log(`Phase 9 Tests Finished: ${passed} Passed, ${failed} Failed`);
  console.log("====================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
