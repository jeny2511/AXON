import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// Load environment variables
dotenv.config();

// Models & routes
import User from "./models/User.js";
import Event from "./models/Event.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import generateToken from "./utils/generateToken.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use(notFound);
app.use(errorHandler);

let server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runPhase3Tests() {
  console.log("==================================================");
  console.log("AXON — PHASE 3 EVENT MANAGEMENT VERIFICATION SUITE");
  console.log("==================================================");

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon");
  console.log("✅ [DB] Connected to MongoDB");

  // Clear previous test events & test users
  await Event.deleteMany({ name: { $regex: /Test Event|Hackathon|Workshop/i } });
  await User.deleteMany({ email: { $in: [
    "p3_student@vgec.ac.in",
    "p3_volunteer@vgec.ac.in",
    "p3_admin@vgec.ac.in"
  ] } });

  // Create test Student
  const studentUser = await User.create({
    fullName: "P3 Student",
    email: "p3_student@vgec.ac.in",
    enrollmentNumber: "220130103001",
    password: "Password@123",
    department: "IT",
    phoneNumber: "9876543210",
    batch: { startYear: 2023, endYear: 2027 },
    role: "student",
    accountStatus: "active"
  });

  // Create test Volunteer
  const volunteerUser = await User.create({
    fullName: "P3 Volunteer",
    email: "p3_volunteer@vgec.ac.in",
    enrollmentNumber: "220130103002",
    password: "Password@123",
    department: "IT",
    phoneNumber: "9876543211",
    batch: { startYear: 2023, endYear: 2027 },
    profilePhoto: "https://example.com/volunteer.png",
    committeePosition: new mongoose.Types.ObjectId(),
    role: "volunteer",
    accountStatus: "active"
  });

  // Create test Admin
  const adminUser = await User.create({
    fullName: "P3 Admin",
    email: "p3_admin@vgec.ac.in",
    enrollmentNumber: "220130103003",
    password: "Password@123",
    department: "IT",
    phoneNumber: "9876543212",
    batch: { startYear: 2023, endYear: 2027 },
    role: "admin",
    accountStatus: "active"
  });

  const studentToken = generateToken(studentUser._id);
  const volunteerToken = generateToken(volunteerUser._id);
  const adminToken = generateToken(adminUser._id);

  server = app.listen(PORT);
  console.log(`✅ [Server] Test Server listening on port ${PORT}\n`);

  let passed = 0;
  let failed = 0;

  async function test(title, fn) {
    try {
      await fn();
      console.log(` PASS: ${title}`);
      passed++;
    } catch (err) {
      console.error(` FAIL: ${title}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  let createdEventId = "";
  let volunteerEventId = "";

  // 1. GET /api/events authenticated
  await test("1. GET /api/events with authenticated token succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data)) {
      throw new Error(`Expected 200 array, got ${res.status}`);
    }
  });

  // 2. GET /api/events without token fails (401)
  await test("2. GET /api/events without token fails (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Admin creates event (201)
  await test("3. POST /api/events by Admin creates Event A (201)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Test Event Alpha - AI & Cyber Defense",
        speakerName: "Dr. Cyber Specialist",
        eventDate: "2026-11-15",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        venue: "Auditorium Main Hall",
        category: "Workshop",
        description: "Comprehensive hands-on cyber defense workshop.",
        participantLimit: 120,
        registrationOpen: "2026-10-01T00:00:00.000Z",
        registrationClose: "2026-11-14T23:59:59.000Z",
        eligibleYears: [2, 3, 4],
        eligibleDepartments: ["IT", "CE"],
        rulebook: "https://example.com/rulebook.pdf"
      })
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data?._id) {
      throw new Error(`Expected 201, got ${res.status}: ${json.message}`);
    }
    createdEventId = json.data._id || json.data.id;
    if (json.data.speakerName !== "Dr. Cyber Specialist") {
      throw new Error(`Speaker not set correctly: ${json.data.speakerName}`);
    }
  });

  // 4. Volunteer creates event (201)
  await test("4. POST /api/events by Volunteer creates Event B (201)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${volunteerToken}`
      },
      body: JSON.stringify({
        name: "Test Event Beta - CTF Challenge",
        speakerName: "TCF Leads",
        eventDate: "2026-12-01",
        startTime: "09:00 AM",
        endTime: "05:00 PM",
        venue: "Computer Center Lab 1",
        category: "Competition",
        description: "Flag hunting cyber security competition.",
        participantLimit: 80,
        registrationOpen: "2026-10-01T00:00:00.000Z",
        registrationClose: "2026-11-30T23:59:59.000Z"
      })
    });
    const json = await res.json();
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${json.message}`);
    volunteerEventId = json.data._id || json.data.id;
  });

  // 5. Student attempts event creation -> 403 Forbidden
  await test("5. POST /api/events by Student fails with 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        name: "Unauthorized Student Event",
        eventDate: "2026-11-20",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        venue: "Lab 2",
        description: "Trying to create without permission.",
        participantLimit: 50
      })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 6. Validation: Missing required fields -> 400
  await test("6. POST /api/events missing required fields fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "No Date Event",
        // date missing
        venue: "Auditorium",
        description: "Missing date field"
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 7. Validation: Invalid registration window (close before open) -> 400
  await test("7. POST /api/events with registration close before open fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Invalid Reg Window Event",
        eventDate: "2026-11-20",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        venue: "Lab 1",
        description: "Testing window error.",
        participantLimit: 50,
        registrationOpen: "2026-11-10T10:00:00.000Z",
        registrationClose: "2026-11-05T10:00:00.000Z" // earlier than open!
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 8. Validation: Invalid same-day times (end before start) -> 400
  await test("8. POST /api/events with same-day end time before start time fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Invalid Time Event",
        eventDate: "2026-11-20",
        startTime: "04:00 PM",
        endTime: "10:00 AM", // before start time!
        venue: "Lab 1",
        description: "Testing time ordering error.",
        participantLimit: 50
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 9. Validation: Negative/Zero participant limit -> 400
  await test("9. POST /api/events with zero participant limit fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Zero Capacity Event",
        eventDate: "2026-11-20",
        startTime: "10:00 AM",
        endTime: "01:00 PM",
        venue: "Lab 1",
        description: "Testing capacity error.",
        participantLimit: 0 // invalid
      })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 10. GET /api/events/:id by ID
  await test("10. GET /api/events/:id returns specific event (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/events/${createdEventId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || json.data.name !== "Test Event Alpha - AI & Cyber Defense") {
      throw new Error(`Expected 200 with event title, got ${res.status}`);
    }
  });

  // 11. GET nonexistent event -> 404
  await test("11. GET /api/events/:id with nonexistent ID returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await fetch(`${BASE_URL}/api/events/${fakeId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  // 12. Update event by Admin
  await test("12. PUT /api/events/:id by Admin updates venue and capacity (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/events/${createdEventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        venue: "Updated Central Auditorium (Block A)",
        participantLimit: 200
      })
    });
    const json = await res.json();
    if (res.status !== 200 || json.data.venue !== "Updated Central Auditorium (Block A)") {
      throw new Error(`Expected 200 with updated venue, got ${res.status}`);
    }
    const dbEvent = await Event.findById(createdEventId);
    if (dbEvent.venue !== "Updated Central Auditorium (Block A)" || dbEvent.participantsLimit !== 200) {
      throw new Error("Database document was not updated");
    }
  });

  // 13. Student attempts event update -> 403
  await test("13. PUT /api/events/:id by Student fails with 403 Forbidden", async () => {
    const res = await fetch(`${BASE_URL}/api/events/${createdEventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ venue: "Hacked Venue" })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 14. Soft delete event by Admin
  await test("14. DELETE /api/events/:id soft-deletes the event (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/events/${volunteerEventId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) throw new Error(`Expected 200, got ${res.status}`);
    const dbEvent = await Event.findById(volunteerEventId);
    if (!dbEvent.isDeleted || !dbEvent.deletedAt) {
      throw new Error("Event was not soft-deleted in database");
    }
  });

  // 15. Deleted event does not appear in normal GET /api/events listing
  await test("15. Soft-deleted event is omitted from GET /api/events listing", async () => {
    const res = await fetch(`${BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    const found = json.data.find(e => (e._id || e.id) === volunteerEventId.toString());
    if (found) throw new Error("Soft-deleted event still appeared in event listing!");
  });

  // 16. Role-based visibility: Student cannot see draft events
  let draftEventId = "";
  await test("16. Role visibility: Student cannot view draft event (404/excluded)", async () => {
    // Admin creates draft
    const draftRes = await fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: "Test Draft Event - Secret Planning",
        eventDate: "2026-12-15",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        venue: "Conference Room",
        description: "Draft agenda.",
        participantLimit: 30,
        status: "draft"
      })
    });
    const draftJson = await draftRes.json();
    draftEventId = draftJson.data._id || draftJson.data.id;

    // Student GET /api/events
    const listRes = await fetch(`${BASE_URL}/api/events`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const listJson = await listRes.json();
    const inList = listJson.data.find(e => (e._id || e.id) === draftEventId.toString());
    if (inList) throw new Error("Student was able to see draft event in listing!");

    // Student direct GET /api/events/:id
    const singleRes = await fetch(`${BASE_URL}/api/events/${draftEventId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (singleRes.status !== 404) throw new Error(`Expected 404 for student viewing draft, got ${singleRes.status}`);

    // Admin CAN view draft
    const adminGet = await fetch(`${BASE_URL}/api/events/${draftEventId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminGet.status !== 200) throw new Error("Admin was unable to view draft event");
  });

  // 17. Cross-Role Consistency Test
  await test("17. Cross-Role Consistency: Admin, Volunteer, and Student receive identical Event A data", async () => {
    const [adminRes, volRes, stuRes] = await Promise.all([
      fetch(`${BASE_URL}/api/events/${createdEventId}`, { headers: { Authorization: `Bearer ${adminToken}` } }),
      fetch(`${BASE_URL}/api/events/${createdEventId}`, { headers: { Authorization: `Bearer ${volunteerToken}` } }),
      fetch(`${BASE_URL}/api/events/${createdEventId}`, { headers: { Authorization: `Bearer ${studentToken}` } })
    ]);

    const adminData = (await adminRes.json()).data;
    const volData = (await volRes.json()).data;
    const stuData = (await stuRes.json()).data;

    if (adminData.name !== stuData.name || volData.name !== stuData.name) {
      throw new Error("Event name inconsistency across roles");
    }
    if (adminData.venue !== stuData.venue || volData.venue !== stuData.venue) {
      throw new Error("Event venue inconsistency across roles");
    }
    if (adminData.participantLimit !== stuData.participantLimit) {
      throw new Error("Participant limit inconsistency across roles");
    }
    if (adminData.eventDate !== stuData.eventDate) {
      throw new Error("Event date inconsistency across roles");
    }
  });

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  server.close();
  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error("FATAL PHASE 3 TEST ERROR:", err);
  if (server) server.close();
  process.exit(1);
});
