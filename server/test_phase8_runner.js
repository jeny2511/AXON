import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import VolunteerTask from "./models/VolunteerTask.js";
import VolunteerAttendance from "./models/VolunteerAttendance.js";
import VolunteerInvolvement from "./models/VolunteerInvolvement.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5059;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 8 COMPREHENSIVE TEST RUNNER       ");
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
  app.use("/api/volunteer", volunteerRoutes);

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
    await User.deleteMany({ email: { $regex: /@phase8test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE8 TEST\]/ } });
    await VolunteerTask.deleteMany({});
    await VolunteerAttendance.deleteMany({});
    await VolunteerInvolvement.deleteMany({});

    // 1. Create Test Users: Student, Volunteer A, Volunteer B, Admin
    const student = await User.create({
      name: "Phase8 Student",
      email: "student@phase8test.com",
      password: "Password@123",
      role: "student",
      enrollmentNumber: "220130107080",
      department: "IT",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543280",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const volunteerA = await User.create({
      name: "Phase8 Volunteer Alpha",
      email: "volunteerA@phase8test.com",
      password: "Password@123",
      role: "volunteer",
      enrollmentNumber: "220130107081",
      department: "CE",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543281",
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteerA.jpg",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const volunteerB = await User.create({
      name: "Phase8 Volunteer Beta",
      email: "volunteerB@phase8test.com",
      password: "Password@123",
      role: "volunteer",
      enrollmentNumber: "220130107082",
      department: "EC",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543282",
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteerB.jpg",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const admin = await User.create({
      name: "Phase8 Admin",
      email: "admin@phase8test.com",
      password: "Password@123",
      role: "admin",
      department: "IT",
      phoneNumber: "9876543283",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const studentToken = generateToken(student._id);
    const volunteerAToken = generateToken(volunteerA._id);
    const volunteerBToken = generateToken(volunteerB._id);
    const adminToken = generateToken(admin._id);

    // 2. Create Test Events
    const activeEvent = await Event.create({
      name: "[PHASE8 TEST] Cyber Security Conclave",
      description: "Annual security conference",
      category: "Conclave",
      venue: "Main Auditorium",
      date: new Date("2026-11-10"),
      startTime: "09:30 AM",
      endTime: "04:30 PM",
      participantsLimit: 120,
      registration: {
        openAt: new Date("2026-10-01"),
        closeAt: new Date("2026-11-05"),
      },
      attendance: {
        openAt: new Date("2026-11-10T09:00:00Z"),
        closeAt: new Date("2026-11-10T17:00:00Z"),
      },
      status: "published",
      isPublished: true,
      createdBy: admin._id,
    });

    const deletedEvent = await Event.create({
      name: "[PHASE8 TEST] Cancelled Symposium",
      description: "Cancelled symposium",
      category: "Symposium",
      venue: "Room 101",
      date: new Date("2026-10-10"),
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      participantsLimit: 40,
      registration: {
        openAt: new Date("2026-09-01"),
        closeAt: new Date("2026-10-05"),
      },
      attendance: {
        openAt: new Date("2026-10-10T10:00:00Z"),
        closeAt: new Date("2026-10-10T13:00:00Z"),
      },
      status: "cancelled",
      isDeleted: true,
      deletedAt: new Date(),
      createdBy: admin._id,
    });

    console.log("\n--- Executing Phase 8 Test Cases ---\n");

    // TEST 1: Unauthenticated task access rejected (401)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`);
      assert(res.status === 401, "1. Unauthenticated task access rejected (401)");
    }

    // TEST 2: Student cannot access volunteer tasks (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(res.status === 403, "2. Student cannot access volunteer tasks (403 Forbidden)");
    }

    // TEST 3: Student cannot create volunteer tasks (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          eventId: activeEvent._id,
          title: "Illegal task",
        }),
      });
      assert(res.status === 403, "3. Student cannot create volunteer tasks (403 Forbidden)");
    }

    // TEST 4: Admin can create task assigned to valid volunteer (201)
    let taskAlphaId = null;
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventId: activeEvent._id,
          title: "Prepare Registration Desk & Badges",
          description: "Organize student badge printing and check-in hardware.",
          assignedTo: volunteerA._id,
          priority: "high",
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        taskAlphaId = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.success === true &&
          data.data.title === "Prepare Registration Desk & Badges" &&
          data.data.assignedTo?._id === volunteerA._id.toString(),
        "4. Admin can create task assigned to valid volunteer (201 Created)"
      );
    }

    // TEST 5: Creating task referencing nonexistent event rejected (404)
    {
      const fakeEventId = new mongoose.Types.ObjectId();
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventId: fakeEventId,
          title: "Invalid Event Task",
          assignedTo: volunteerA._id,
        }),
      });
      assert(res.status === 404, "5. Creating task referencing nonexistent event rejected (404)");
    }

    // TEST 6: Creating task referencing soft-deleted event rejected (404)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventId: deletedEvent._id,
          title: "Deleted Event Task",
          assignedTo: volunteerA._id,
        }),
      });
      assert(res.status === 404, "6. Creating task referencing soft-deleted event rejected (404)");
    }

    // TEST 7: Assigning task to non-volunteer role user (e.g. Student) rejected (400)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventId: activeEvent._id,
          title: "Invalid Volunteer Role Assignment",
          assignedTo: student._id, // student is not a volunteer
        }),
      });
      assert(res.status === 400, "7. Assigning task to non-volunteer role user rejected (400)");
    }

    // TEST 8: Admin creates a second task assigned to Volunteer B
    let taskBetaId = null;
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventId: activeEvent._id,
          title: "Manage Stage Audio & Streaming",
          description: "Setup mics and OBS studio streaming server.",
          assignedTo: volunteerB._id,
          priority: "medium",
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        taskBetaId = data.data._id;
      }
      assert(
        res.status === 201 && data.data.assignedTo?._id === volunteerB._id.toString(),
        "8. Admin creates a second task assigned to Volunteer B (201 Created)"
      );
    }

    // TEST 9: Volunteer A retrieves own assigned tasks
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        headers: { Authorization: `Bearer ${volunteerAToken}` },
      });
      const data = await res.json();
      const ids = data.data.map((t) => t._id);
      assert(
        res.status === 200 &&
          ids.includes(taskAlphaId) &&
          !ids.includes(taskBetaId),
        "9. Volunteer A retrieves own assigned tasks and does not see Volunteer B's private tasks"
      );
    }

    // TEST 10: Volunteer B retrieves own assigned tasks
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        headers: { Authorization: `Bearer ${volunteerBToken}` },
      });
      const data = await res.json();
      const ids = data.data.map((t) => t._id);
      assert(
        res.status === 200 &&
          ids.includes(taskBetaId) &&
          !ids.includes(taskAlphaId),
        "10. Volunteer B retrieves own assigned tasks and does not see Volunteer A's private tasks"
      );
    }

    // TEST 11: Volunteer A updates status of own assigned task to "in-progress" and "completed" (200)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks/${taskAlphaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerAToken}`,
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.data.status === "completed" &&
          data.data.completed === true &&
          data.data.completedBy?._id === volunteerA._id.toString(),
        "11. Volunteer A updates status of own assigned task to completed (200 OK)"
      );
    }

    // TEST 12: Volunteer B cannot update Volunteer A's assigned task (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks/${taskAlphaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerBToken}`,
        },
        body: JSON.stringify({
          status: "pending",
        }),
      });
      assert(
        res.status === 403,
        "12. Volunteer B cannot update Volunteer A's assigned task (403 Forbidden)"
      );
    }

    // TEST 13: Updating task with invalid status value rejected (400)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks/${taskAlphaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerAToken}`,
        },
        body: JSON.stringify({
          status: "invalid-status-value",
        }),
      });
      assert(res.status === 400, "13. Updating task with invalid status value rejected (400)");
    }

    // TEST 14: Cross-Role Consistency: Admin retrieves task updated by Volunteer A and sees the live updated status
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks/${taskAlphaId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.data.status === "completed" &&
          data.data.completed === true,
        "14. Cross-role consistency: Admin sees real-time status update done by Volunteer A"
      );
    }

    // TEST 15: Admin can soft-delete volunteer task (200)
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks/${taskBetaId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, "15. Admin can soft-delete volunteer task (200 OK)");
    }

    // TEST 16: Soft-deleted task is omitted from task listings
    {
      const res = await fetch(`${BASE_URL}/volunteer/tasks`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      const ids = data.data.map((t) => t._id);
      assert(
        res.status === 200 &&
          !ids.includes(taskBetaId) &&
          ids.includes(taskAlphaId),
        "16. Soft-deleted task is omitted from task listings"
      );
    }

    // TEST 17: Unauthenticated volunteer attendance access rejected (401)
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance`);
      assert(res.status === 401, "17. Unauthenticated volunteer attendance access rejected (401)");
    }

    // TEST 18: Student cannot access or mark volunteer attendance (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(
        res.status === 403,
        "18. Student cannot access or mark volunteer attendance (403 Forbidden)"
      );
    }

    // TEST 19: Admin records volunteer attendance for Volunteer A (201)
    let attendanceRecId = null;
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: volunteerA._id,
          activityType: "event",
          eventId: activeEvent._id,
          date: "2026-11-10",
          time: "09:30 AM",
          venue: "Main Auditorium",
          topic: "Event Registration Desk Duty",
          attendanceStatus: "present",
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        attendanceRecId = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.success === true &&
          data.data.volunteerId?._id === volunteerA._id.toString() &&
          data.data.attendanceStatus === "present",
        "19. Admin records volunteer attendance for Volunteer A (201 Created)"
      );
    }

    // TEST 20: Marking volunteer attendance with invalid activity type rejected (400)
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: volunteerA._id,
          activityType: "unsupported-activity-type",
          date: "2026-11-10",
          time: "09:30 AM",
        }),
      });
      assert(
        res.status === 400,
        "20. Marking volunteer attendance with invalid activity type rejected (400)"
      );
    }

    // TEST 21: Volunteer A retrieves own volunteer attendance records
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance`, {
        headers: { Authorization: `Bearer ${volunteerAToken}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          Array.isArray(data.data) &&
          data.data.length === 1 &&
          data.data[0]._id === attendanceRecId,
        "21. Volunteer A retrieves own volunteer attendance records (200 OK)"
      );
    }

    // TEST 22: Volunteer cannot delete volunteer attendance (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/attendance/${attendanceRecId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${volunteerAToken}` },
      });
      assert(
        res.status === 403,
        "22. Volunteer cannot delete volunteer attendance (403 Forbidden)"
      );
    }

    // TEST 23: Admin creates and retrieves volunteer involvement linking volunteer and event (201 / 200)
    let involvementId = null;
    {
      const res = await fetch(`${BASE_URL}/volunteer/involvements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          volunteerId: volunteerA._id,
          eventId: activeEvent._id,
          responsibility: "Registration & Hardware Lead",
          roleStatus: "assigned",
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        involvementId = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.data.responsibility === "Registration & Hardware Lead" &&
          data.data.volunteerId?._id === volunteerA._id.toString(),
        "23. Admin creates volunteer involvement linking volunteer and event (201 Created)"
      );
    }

    // TEST 24: Student cannot access volunteer involvement (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/volunteer/involvements`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(
        res.status === 403,
        "24. Student cannot access volunteer involvement (403 Forbidden)"
      );
    }

    // TEST 25: Volunteer Dashboard stats calculation returns accurate live metrics from MongoDB
    {
      const res = await fetch(`${BASE_URL}/volunteer/dashboard-stats`, {
        headers: { Authorization: `Bearer ${volunteerAToken}` },
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.data.totalTasks === 1 &&
          data.data.completedTasks === 1 &&
          data.data.attendanceCount === 1 &&
          data.data.totalInvolvements === 1 &&
          data.data.taskCompletionRate === 100,
        "25. Volunteer Dashboard stats calculation returns accurate live metrics from MongoDB"
      );
    }

    // TEST 26: Cross-role consistency: Admin and Volunteer see identical attendance and involvement records
    {
      const resAdminAtt = await fetch(`${BASE_URL}/volunteer/attendance`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const resVolAtt = await fetch(`${BASE_URL}/volunteer/attendance`, {
        headers: { Authorization: `Bearer ${volunteerAToken}` },
      });

      const dataAdmin = await resAdminAtt.json();
      const dataVol = await resVolAtt.json();

      assert(
        dataAdmin.data[0]._id === dataVol.data[0]._id &&
          dataAdmin.data[0].attendanceStatus === dataVol.data[0].attendanceStatus,
        "26. Cross-role consistency: Admin and Volunteer see identical attendance records from MongoDB"
      );
    }

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("\n====================================================");
    console.log(`Phase 8 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("====================================================");
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
