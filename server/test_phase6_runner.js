import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";
import StudentEventQR from "./models/StudentEventQR.js";
import Attendance from "./models/Attendance.js";
import Feedback from "./models/Feedback.js";
import Certificate from "./models/Certificate.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5057;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 6 COMPREHENSIVE TEST RUNNER       ");
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
    await User.deleteMany({ email: { $regex: /@phase6test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE6 TEST\]/ } });
    await Feedback.deleteMany({});
    await Certificate.deleteMany({});

    // 1. Create Test Users
    const student1 = await User.create({
      name: "Phase6 Student One",
      email: "student1@phase6test.com",
      password: "Password@123",
      role: "student",
      enrollmentNumber: "220130107091",
      department: "IT",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543210",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const student2 = await User.create({
      name: "Phase6 Student Two",
      email: "student2@phase6test.com",
      password: "Password@123",
      role: "student",
      enrollmentNumber: "220130107092",
      department: "CE",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543211",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const volunteer = await User.create({
      name: "Phase6 Volunteer",
      email: "volunteer@phase6test.com",
      password: "Password@123",
      role: "volunteer",
      enrollmentNumber: "220130107093",
      department: "EC",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543212",
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteer.jpg",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const admin = await User.create({
      name: "Phase6 Admin",
      email: "admin@phase6test.com",
      password: "Password@123",
      role: "admin",
      department: "IT",
      phoneNumber: "9876543213",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const student1Token = generateToken(student1._id);
    const student2Token = generateToken(student2._id);
    const volunteerToken = generateToken(volunteer._id);
    const adminToken = generateToken(admin._id);

    // 2. Create Test Events
    // Event A: Feedback required, certificates available
    const eventA = await Event.create({
      name: "[PHASE6 TEST] Cybersecurity Workshop",
      description: "Advanced Threat Hunting & Forensics",
      category: "Workshop",
      venue: "Lab 3",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday (completed)
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      participantsLimit: 50,
      registration: {
        openAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      registeredCount: 2,
      attendedCount: 1,
      status: "published",
      isPublished: true,
      feedbackRequired: true,
      certificateAvailable: true,
      createdBy: admin._id,
      assignedVolunteers: [volunteer._id],
    });

    // Event B: Certificate available = false
    const eventB = await Event.create({
      name: "[PHASE6 TEST] No Cert Seminar",
      description: "Informal Orientation Seminar",
      category: "Seminar",
      venue: "Auditorium",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      participantsLimit: 50,
      registration: {
        openAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      registeredCount: 1,
      attendedCount: 1,
      status: "published",
      isPublished: true,
      feedbackRequired: false,
      certificateAvailable: false,
      createdBy: admin._id,
      assignedVolunteers: [volunteer._id],
    });

    // 3. Create Registrations
    const reg1A = await Registration.create({
      studentId: student1._id,
      eventId: eventA._id,
      status: "registered",
      registeredAt: new Date(),
    });

    const reg2A = await Registration.create({
      studentId: student2._id,
      eventId: eventA._id,
      status: "registered",
      registeredAt: new Date(),
    });

    const reg1B = await Registration.create({
      studentId: student1._id,
      eventId: eventB._id,
      status: "registered",
      registeredAt: new Date(),
    });

    // 4. Mark Attendance for Student 1 on Event A and Event B
    await Attendance.create({
      eventId: eventA._id,
      studentId: student1._id,
      registrationId: reg1A._id,
      status: "present",
      markedBy: volunteer._id,
      markedAt: new Date(),
    });

    await Attendance.create({
      eventId: eventB._id,
      studentId: student1._id,
      registrationId: reg1B._id,
      status: "present",
      markedBy: volunteer._id,
      markedAt: new Date(),
    });

    // Student 2 is registered for Event A but was absent (no attendance record)

    console.log("\n--- Executing Phase 6 Test Cases ---\n");

    // TEST 1: Unauthenticated feedback submission rejected
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: eventA._id,
          overallRating: 5,
        }),
      });
      assert(res.status === 401, "1. Unauthenticated feedback submission rejected (401)");
    }

    // TEST 2: Student cannot submit feedback without attendance
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student2Token}`,
        },
        body: JSON.stringify({
          eventId: eventA._id,
          overallRating: 5,
          contentRating: 4,
          speakerRating: 5,
          organizationRating: 4,
          comment: "Loved the event but did not attend",
        }),
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.message.includes("attended"),
        "2. Student cannot submit feedback without attendance (400)"
      );
    }

    // TEST 3: Student cannot submit feedback for another student
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student2Token}`,
        },
        body: JSON.stringify({
          eventId: eventA._id,
          studentId: student1._id, // trying to spoof student1
          overallRating: 5,
        }),
      });
      // Should reject either because student2 is not attended or server overrides studentId to req.user._id
      assert(res.status === 400, "3. Student cannot spoof or submit feedback for another student (400)");
    }

    // TEST 4: Invalid feedback rating range rejected
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student1Token}`,
        },
        body: JSON.stringify({
          eventId: eventA._id,
          overallRating: 6, // invalid > 5
          contentRating: 0, // invalid < 1
        }),
      });
      assert(res.status === 400, "4. Invalid feedback rating range (< 1 or > 5) rejected (400)");
    }

    // TEST 5: Student can submit valid feedback after attendance
    let submittedFeedbackId = null;
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student1Token}`,
        },
        body: JSON.stringify({
          eventId: eventA._id,
          overallRating: 5,
          contentRating: 4,
          speakerRating: 5,
          organizationRating: 5,
          comment: "Exceptional hands-on workshop on memory forensics!",
          wouldRecommend: true,
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        submittedFeedbackId = data.data._id;
      }
      assert(
        res.status === 201 && data.success && data.data?.overallRating === 5,
        "5. Student can submit valid feedback after verified attendance (201)"
      );
    }

    // TEST 6: Student cannot submit duplicate feedback for the same event
    {
      const res = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${student1Token}`,
        },
        body: JSON.stringify({
          eventId: eventA._id,
          overallRating: 4,
          comment: "Submitting again",
        }),
      });
      const data = await res.json();
      assert(
        (res.status === 400 || res.status === 409) && data.message.includes("already submitted"),
        "6. Student cannot submit duplicate feedback for the same event (400/409)"
      );
    }

    // TEST 7: Student can retrieve own submitted feedback
    {
      const res = await fetch(`${BASE_URL}/feedback/my`, {
        headers: { Authorization: `Bearer ${student1Token}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 && Array.isArray(data.data) && data.data.length === 1,
        "7. Student can retrieve own feedback via GET /api/feedback/my (200)"
      );
    }

    // TEST 8: Student cannot retrieve another student's feedback by ID
    {
      const res = await fetch(`${BASE_URL}/feedback/${submittedFeedbackId}`, {
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert(
        res.status === 403,
        "8. Student cannot retrieve another student's feedback by ID (403 Forbidden)"
      );
    }

    // TEST 9: Volunteer / Admin can retrieve authorized event feedback with computed summary
    {
      const res = await fetch(`${BASE_URL}/feedback/event/${eventA._id}`, {
        headers: { Authorization: `Bearer ${volunteerToken}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.success &&
          data.summary?.totalResponses === 1 &&
          data.summary?.averageRating === 5 &&
          data.summary?.recommendationPercentage === 100,
        "9. Volunteer/Admin can retrieve event feedback with computed rating analytics (200)"
      );
    }

    // TEST 10: Unauthenticated certificate access / generation rejected
    {
      const res = await fetch(`${BASE_URL}/certificates/my`);
      assert(res.status === 401, "10. Unauthenticated certificate access rejected (401)");
    }

    // TEST 11: Check eligibility endpoint returns true for student1 and false for student2
    {
      const res1 = await fetch(`${BASE_URL}/certificates/eligibility/${eventA._id}`, {
        headers: { Authorization: `Bearer ${student1Token}` },
      });
      const data1 = await res1.json();

      const res2 = await fetch(`${BASE_URL}/certificates/eligibility/${eventA._id}`, {
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      const data2 = await res2.json();

      assert(
        res1.status === 200 &&
          data1.data?.eligible === true &&
          res2.status === 200 &&
          data2.data?.eligible === false &&
          data2.data?.criteria?.hasAttendance === false,
        "11. Certificate eligibility logic accurately verifies registration, attendance & feedback"
      );
    }

    // TEST 12: Certificate cannot be generated for unregistered or non-attending student
    // When generating for eventA, student2 should be skipped because they didn't attend
    let genResultData = null;
    {
      const res = await fetch(`${BASE_URL}/certificates/generate/${eventA._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      genResultData = await res.json();
      assert(
        res.status === 200 &&
          genResultData.generatedCount === 1 &&
          genResultData.skippedCount === 1,
        "12. Certificate generation generates only for eligible attendees and skips absent ones"
      );
    }

    // TEST 13: Certificate cannot be released when certificateAvailable === false
    {
      const res = await fetch(`${BASE_URL}/certificates/generate/${eventB._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      assert(
        res.status === 400 && data.message.includes("not enabled"),
        "13. certificateAvailable=false prevents certificate generation and release (400)"
      );
    }

    // TEST 14: Eligible certificate is stored in MongoDB with correct references and verification code
    let generatedCert = null;
    {
      generatedCert = await Certificate.findOne({
        eventId: eventA._id,
        studentId: student1._id,
      });

      assert(
        generatedCert !== null &&
          generatedCert.status === "issued" &&
          typeof generatedCert.verificationCode === "string" &&
          generatedCert.verificationCode.startsWith("AXON-") &&
          String(generatedCert.registrationId) === String(reg1A._id),
        "14. Eligible certificate is stored in MongoDB with unique verification code and references"
      );
    }

    // TEST 15: Duplicate certificate generation is idempotent (does not create duplicate rows)
    {
      const res = await fetch(`${BASE_URL}/certificates/generate/${eventA._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();

      const totalCertsInDb = await Certificate.countDocuments({
        eventId: eventA._id,
        studentId: student1._id,
      });

      assert(
        res.status === 200 && data.generatedCount === 0 && totalCertsInDb === 1,
        "15. Duplicate certificate generation is idempotent and creates no duplicate records"
      );
    }

    // TEST 16: Student can retrieve own certificates via GET /api/certificates/my
    {
      const res = await fetch(`${BASE_URL}/certificates/my`, {
        headers: { Authorization: `Bearer ${student1Token}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          Array.isArray(data.data) &&
          data.data.length === 1 &&
          data.data[0].verificationCode === generatedCert.verificationCode,
        "16. Student can retrieve own certificates via GET /api/certificates/my (200)"
      );
    }

    // TEST 17: Student cannot access another student's certificate by ID
    {
      const res = await fetch(`${BASE_URL}/certificates/${generatedCert._id}`, {
        headers: { Authorization: `Bearer ${student2Token}` },
      });
      assert(
        res.status === 403,
        "17. Student cannot access another student's certificate by ID (403 Forbidden)"
      );
    }

    // TEST 18: Volunteer/Admin can retrieve event certificates
    {
      const res = await fetch(`${BASE_URL}/certificates/event/${eventA._id}`, {
        headers: { Authorization: `Bearer ${volunteerToken}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 && Array.isArray(data.data) && data.data.length === 1,
        "18. Volunteer/Admin can retrieve event certificates via GET /api/certificates/event/:id (200)"
      );
    }

    // TEST 19: Public certificate verification endpoint succeeds with valid verificationCode
    {
      const res = await fetch(
        `${BASE_URL}/certificates/verify/${generatedCert.verificationCode}`
      );
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.success === true &&
          data.data?.studentName === student1.name &&
          data.data?.eventName === eventA.name,
        "19. Public certificate verification endpoint verifies authentic certificate by code (200)"
      );
    }

    // TEST 20: Public certificate verification returns 404 for invalid code
    {
      const res = await fetch(`${BASE_URL}/certificates/verify/FAKE-CODE-9999`);
      assert(
        res.status === 404,
        "20. Public certificate verification returns 404 for invalid verification code"
      );
    }

    // TEST 21: Database compound unique index on Feedback enforces duplicate protection
    let indexPreventedDuplicateFeedback = false;
    try {
      await Feedback.create({
        eventId: eventA._id,
        studentId: student1._id,
        registrationId: reg1A._id,
        overallRating: 5,
        submittedAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000 || err.message.includes("duplicate key") || err.message.includes("E11000")) {
        indexPreventedDuplicateFeedback = true;
      }
    }
    assert(
      indexPreventedDuplicateFeedback,
      "21. MongoDB compound unique index on Feedback prevents duplicate submissions"
    );

    // TEST 22: Database compound unique index on Certificate enforces single certificate per event
    let indexPreventedDuplicateCert = false;
    try {
      await Certificate.create({
        eventId: eventA._id,
        studentId: student1._id,
        registrationId: reg1A._id,
        studentName: "Phase6 Student One",
        enrollmentNumber: "220130107091",
        pdfUrl: "/test.pdf",
        verificationCode: "AXON-DUP-12345",
        status: "issued",
      });
    } catch (err) {
      if (err.code === 11000 || err.message.includes("duplicate key") || err.message.includes("E11000")) {
        indexPreventedDuplicateCert = true;
      }
    }
    assert(
      indexPreventedDuplicateCert,
      "22. MongoDB compound unique index on Certificate prevents duplicate certificates"
    );

    // TEST 23: Certificate generation requires feedback when event.feedbackRequired === true
    // Let's create event C (feedbackRequired: true), register student1 and mark present, but NO feedback submitted
    const eventC = await Event.create({
      name: "[PHASE6 TEST] Advanced Cryptography",
      description: "Post-Quantum Cryptography Seminar",
      category: "Technical",
      venue: "Seminar Hall",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      participantsLimit: 50,
      registration: {
        openAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
        closeAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      registeredCount: 1,
      attendedCount: 1,
      status: "published",
      isPublished: true,
      feedbackRequired: true,
      certificateAvailable: true,
      createdBy: admin._id,
      assignedVolunteers: [volunteer._id],
    });

    const reg1C = await Registration.create({
      studentId: student1._id,
      eventId: eventC._id,
      status: "registered",
      registeredAt: new Date(),
    });

    await Attendance.create({
      eventId: eventC._id,
      studentId: student1._id,
      registrationId: reg1C._id,
      status: "present",
      markedBy: volunteer._id,
      markedAt: new Date(),
    });

    // Check eligibility before feedback
    const eligBeforeRes = await fetch(`${BASE_URL}/certificates/eligibility/${eventC._id}`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const eligBeforeData = await eligBeforeRes.json();

    // Now submit feedback for event C
    await fetch(`${BASE_URL}/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${student1Token}`,
      },
      body: JSON.stringify({
        eventId: eventC._id,
        overallRating: 5,
        contentRating: 5,
        speakerRating: 5,
        comment: "Great crypto session",
      }),
    });

    // Check eligibility after feedback
    const eligAfterRes = await fetch(`${BASE_URL}/certificates/eligibility/${eventC._id}`, {
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const eligAfterData = await eligAfterRes.json();

    assert(
      eligBeforeData.data?.eligible === false &&
        eligBeforeData.data?.criteria?.hasSubmittedFeedback === false &&
        eligAfterData.data?.eligible === true &&
        eligAfterData.data?.criteria?.hasSubmittedFeedback === true,
      "23. Certificate eligibility strictly gates on feedback submission when feedbackRequired=true"
    );

    // TEST 24: Staff generates certificate for event C after feedback
    {
      const res = await fetch(`${BASE_URL}/certificates/generate/${eventC._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.generatedCount === 1,
        "24. Certificate generated successfully for attendee once required feedback is present"
      );
    }

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("\n====================================================");
    console.log(`Phase 6 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("====================================================");
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
