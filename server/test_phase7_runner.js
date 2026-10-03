import mongoose from "mongoose";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import User from "./models/User.js";
import Event from "./models/Event.js";
import Gallery from "./models/Gallery.js";
import LearningResource from "./models/LearningResource.js";
import generateToken from "./utils/generateToken.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import galleryRoutes from "./routes/galleryRoutes.js";
import learningRoutes from "./routes/learningRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon";
const TEST_PORT = 5058;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function runTests() {
  console.log("====================================================");
  console.log("       AXON PHASE 7 COMPREHENSIVE TEST RUNNER       ");
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
  app.use("/api/gallery", galleryRoutes);
  app.use("/api/learning", learningRoutes);

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
    await User.deleteMany({ email: { $regex: /@phase7test\.com$/ } });
    await Event.deleteMany({ name: { $regex: /^\[PHASE7 TEST\]/ } });
    await Gallery.deleteMany({ eventName: { $regex: /^\[PHASE7 TEST\]/ } });
    await LearningResource.deleteMany({ title: { $regex: /^\[PHASE7 TEST\]/ } });

    // 1. Create Test Users
    const student = await User.create({
      name: "Phase7 Student",
      email: "student@phase7test.com",
      password: "Password@123",
      role: "student",
      enrollmentNumber: "220130107099",
      department: "IT",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543290",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const volunteer = await User.create({
      name: "Phase7 Volunteer",
      email: "volunteer@phase7test.com",
      password: "Password@123",
      role: "volunteer",
      enrollmentNumber: "220130107098",
      department: "CE",
      semester: 6,
      batch: { startYear: 2024, endYear: 2028 },
      phoneNumber: "9876543291",
      committeePosition: new mongoose.Types.ObjectId(),
      profilePhoto: "https://example.com/volunteer7.jpg",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const admin = await User.create({
      name: "Phase7 Admin",
      email: "admin@phase7test.com",
      password: "Password@123",
      role: "admin",
      department: "IT",
      phoneNumber: "9876543292",
      accountStatus: "active",
      isEmailVerified: true,
    });

    const studentToken = generateToken(student._id);
    const volunteerToken = generateToken(volunteer._id);
    const adminToken = generateToken(admin._id);

    // 2. Create Live and Soft-Deleted Events for testing event reference linking
    const activeEvent = await Event.create({
      name: "[PHASE7 TEST] CTF Grand Finale 2026",
      description: "Annual CTF Championship",
      category: "Competition",
      venue: "Main Auditorium",
      date: new Date("2026-09-20"),
      startTime: "09:00 AM",
      endTime: "05:00 PM",
      participantsLimit: 100,
      registration: {
        openAt: new Date("2026-09-01"),
        closeAt: new Date("2026-09-18"),
      },
      attendance: {
        openAt: new Date("2026-09-20T09:00:00Z"),
        closeAt: new Date("2026-09-20T17:00:00Z"),
      },
      status: "completed",
      isPublished: true,
      createdBy: admin._id,
    });

    const deletedEvent = await Event.create({
      name: "[PHASE7 TEST] Cancelled Hackathon",
      description: "Cancelled event",
      category: "Hackathon",
      venue: "Lab 2",
      date: new Date("2026-08-10"),
      startTime: "10:00 AM",
      endTime: "04:00 PM",
      participantsLimit: 50,
      registration: {
        openAt: new Date("2026-08-01"),
        closeAt: new Date("2026-08-09"),
      },
      attendance: {
        openAt: new Date("2026-08-10T10:00:00Z"),
        closeAt: new Date("2026-08-10T16:00:00Z"),
      },
      status: "cancelled",
      isDeleted: true,
      deletedAt: new Date(),
      createdBy: admin._id,
    });

    console.log("\n--- Executing Phase 7 Test Cases ---\n");

    // TEST 1: Unauthenticated GET /api/gallery is rejected with 401
    {
      const res = await fetch(`${BASE_URL}/gallery`);
      assert(res.status === 401, "1. Unauthenticated GET /api/gallery rejected with 401");
    }

    // TEST 2: Unauthenticated GET /api/learning is rejected with 401
    {
      const res = await fetch(`${BASE_URL}/learning`);
      assert(res.status === 401, "2. Unauthenticated GET /api/learning rejected with 401");
    }

    // TEST 3: Student cannot create gallery item (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          eventName: "[PHASE7 TEST] Student Attempt",
          venue: "Audi",
        }),
      });
      assert(res.status === 403, "3. Student cannot create gallery item (403 Forbidden)");
    }

    // TEST 4: Student cannot create learning resource (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] Student Article",
          category: "article",
        }),
      });
      assert(res.status === 403, "4. Student cannot create learning resource (403 Forbidden)");
    }

    // TEST 5: Volunteer can create gallery item successfully (201)
    let galleryItem1Id = null;
    {
      const res = await fetch(`${BASE_URL}/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          eventName: "[PHASE7 TEST] Ethical Hacking Bootcamp",
          venue: "Computer Center",
          date: "2026-09-15",
          time: "10:00 AM - 04:00 PM",
          description: "Hands-on boot camp covering network reconnaissance and exploitation.",
          banner: "https://example.com/banner1.jpg",
          photos: ["https://example.com/p1.jpg", "https://example.com/p2.jpg"],
          tags: ["EthicalHacking", "HandsOn", "TCF2026"],
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        galleryItem1Id = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.success === true &&
          data.data.eventName === "[PHASE7 TEST] Ethical Hacking Bootcamp",
        "5. Volunteer can create gallery item successfully (201 Created)"
      );
    }

    // TEST 6: Admin can create gallery item linked to valid Event (201)
    let galleryItem2Id = null;
    {
      const res = await fetch(`${BASE_URL}/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventName: activeEvent.name,
          eventId: activeEvent._id,
          venue: activeEvent.venue,
          date: activeEvent.date,
          description: "Highlights and winner photos from the Grand Finale.",
          photos: ["https://example.com/ctf1.jpg", "https://example.com/ctf2.jpg"],
          tags: ["CTF", "Championship"],
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        galleryItem2Id = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.data.eventId?._id === activeEvent._id.toString(),
        "6. Admin can create gallery item linked to valid Event (201 Created)"
      );
    }

    // TEST 7: Creating gallery item referencing nonexistent event returns 404
    {
      const fakeEventId = new mongoose.Types.ObjectId();
      const res = await fetch(`${BASE_URL}/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventName: "[PHASE7 TEST] Invalid Event",
          eventId: fakeEventId,
        }),
      });
      assert(
        res.status === 404,
        "7. Creating gallery item referencing nonexistent event returns 404"
      );
    }

    // TEST 8: Creating gallery item referencing soft-deleted event returns 404
    {
      const res = await fetch(`${BASE_URL}/gallery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          eventName: "[PHASE7 TEST] Deleted Event Ref",
          eventId: deletedEvent._id,
        }),
      });
      assert(
        res.status === 404,
        "8. Creating gallery item referencing soft-deleted event returns 404"
      );
    }

    // TEST 9: Student cannot update gallery item (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/gallery/${galleryItem1Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          venue: "Hacked Venue",
        }),
      });
      assert(res.status === 403, "9. Student cannot update gallery item (403 Forbidden)");
    }

    // TEST 10: Volunteer/Admin updates gallery item details and tags (200)
    {
      const res = await fetch(`${BASE_URL}/gallery/${galleryItem1Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          venue: "Upgraded Cyber Lab 1",
          tags: ["EthicalHacking", "UpdatedTag"],
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.data.venue === "Upgraded Cyber Lab 1" &&
          data.data.tags.includes("UpdatedTag"),
        "10. Volunteer/Admin updates gallery item details and tags (200 OK)"
      );
    }

    // TEST 11: Student cannot delete gallery item (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/gallery/${galleryItem1Id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(res.status === 403, "11. Student cannot delete gallery item (403 Forbidden)");
    }

    // TEST 12: Admin soft-deletes gallery item (200)
    {
      const res = await fetch(`${BASE_URL}/gallery/${galleryItem1Id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, "12. Admin soft-deletes gallery item (200 OK)");
    }

    // TEST 13: Soft-deleted gallery item is omitted from GET /api/gallery
    {
      const res = await fetch(`${BASE_URL}/gallery`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const ids = data.data.map((item) => item._id);
      assert(
        res.status === 200 &&
          !ids.includes(galleryItem1Id) &&
          ids.includes(galleryItem2Id),
        "13. Soft-deleted gallery item is omitted from GET /api/gallery"
      );
    }

    // TEST 14: Volunteer can create learning resource (201)
    let resource1Id = null;
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] OWASP Top 10 Web Vulnerabilities 2026",
          description: "Comprehensive guide to SQLi, XSS, SSRF and IDOR vectors.",
          category: "article",
          contentType: "article",
          content: "In depth analysis of modern web exploitation vectors...",
          readTime: "8 min read",
          tags: ["OWASP", "WebSecurity", "AppSec"],
          author: "TCF AppSec SIG",
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        resource1Id = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.success === true &&
          data.data.title === "[PHASE7 TEST] OWASP Top 10 Web Vulnerabilities 2026",
        "14. Volunteer can create learning resource (201 Created)"
      );
    }

    // TEST 15: Admin can create featured research paper resource (201)
    let resource2Id = null;
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] Post-Quantum Cryptographic Key Exchange",
          description: "Research paper evaluating lattice-based cryptography against quantum threats.",
          category: "research paper",
          contentType: "pdf",
          pdfUrl: "https://example.com/quantum_crypto.pdf",
          externalUrl: "https://arxiv.org/abs/2401.00000",
          readTime: "15 min read",
          isFeatured: true,
          tags: ["Quantum", "Cryptography", "Research"],
        }),
      });
      const data = await res.json();
      if (res.status === 201 && data.data) {
        resource2Id = data.data._id;
      }
      assert(
        res.status === 201 &&
          data.data.isFeatured === true &&
          data.data.category === "research paper",
        "15. Admin can create featured research paper resource (201 Created)"
      );
    }

    // TEST 16: Creating learning resource with invalid category returns 400
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] Invalid Category",
          category: "unsupported-category",
        }),
      });
      assert(
        res.status === 400,
        "16. Creating learning resource with invalid category returns 400"
      );
    }

    // TEST 17: Creating learning resource with invalid contentType returns 400
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] Invalid ContentType",
          category: "tool",
          contentType: "unsupported-content-type",
        }),
      });
      assert(
        res.status === 400,
        "17. Creating learning resource with invalid contentType returns 400"
      );
    }

    // TEST 18: Student cannot update learning resource (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/learning/${resource1Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${studentToken}`,
        },
        body: JSON.stringify({
          title: "Student Attempted Change",
        }),
      });
      assert(res.status === 403, "18. Student cannot update learning resource (403 Forbidden)");
    }

    // TEST 19: Volunteer/Admin updates learning resource title, content, and external link (200)
    {
      const res = await fetch(`${BASE_URL}/learning/${resource1Id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${volunteerToken}`,
        },
        body: JSON.stringify({
          title: "[PHASE7 TEST] OWASP Top 10 Web Vulnerabilities 2026 (Updated)",
          externalUrl: "https://owasp.org/top10",
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 &&
          data.data.title.includes("(Updated)") &&
          data.data.externalUrl === "https://owasp.org/top10",
        "19. Volunteer/Admin updates learning resource title and external link (200 OK)"
      );
    }

    // TEST 20: Student cannot delete learning resource (403 Forbidden)
    {
      const res = await fetch(`${BASE_URL}/learning/${resource1Id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(res.status === 403, "20. Student cannot delete learning resource (403 Forbidden)");
    }

    // TEST 21: Volunteer/Admin soft-deletes learning resource (200)
    {
      const res = await fetch(`${BASE_URL}/learning/${resource1Id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert(res.status === 200, "21. Volunteer/Admin soft-deletes learning resource (200 OK)");
    }

    // TEST 22: Soft-deleted learning resource is omitted from GET /api/learning for students
    {
      const res = await fetch(`${BASE_URL}/learning`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const data = await res.json();
      const ids = data.data.map((item) => item._id);
      assert(
        res.status === 200 &&
          !ids.includes(resource1Id) &&
          ids.includes(resource2Id),
        "22. Soft-deleted learning resource is omitted from GET /api/learning"
      );
    }

    // TEST 23: Gallery search and tag filtering work accurately
    {
      const resSearch = await fetch(`${BASE_URL}/gallery?search=Championship`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const dataSearch = await resSearch.json();

      const resTag = await fetch(`${BASE_URL}/gallery?tag=CTF`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const dataTag = await resTag.json();

      assert(
        dataSearch.count === 1 &&
          dataSearch.data[0]._id === galleryItem2Id &&
          dataTag.count === 1 &&
          dataTag.data[0]._id === galleryItem2Id,
        "23. Gallery search and tag filter return matching records from MongoDB"
      );
    }

    // TEST 24: Learning Hub category and search filtering work accurately
    {
      const resCategory = await fetch(`${BASE_URL}/learning?category=research%20paper`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const dataCategory = await resCategory.json();

      const resSearch = await fetch(`${BASE_URL}/learning?search=Quantum`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const dataSearch = await resSearch.json();

      assert(
        dataCategory.count === 1 &&
          dataCategory.data[0]._id === resource2Id &&
          dataSearch.count === 1 &&
          dataSearch.data[0]._id === resource2Id,
        "24. Learning Hub category and search filtering work accurately"
      );
    }

    // TEST 25: Cross-role consistency: Student, Volunteer, and Admin receive the exact same MongoDB data
    {
      const resStudent = await fetch(`${BASE_URL}/gallery`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const resVolunteer = await fetch(`${BASE_URL}/gallery`, {
        headers: { Authorization: `Bearer ${volunteerToken}` },
      });
      const resAdmin = await fetch(`${BASE_URL}/gallery`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const dataS = await resStudent.json();
      const dataV = await resVolunteer.json();
      const dataA = await resAdmin.json();

      assert(
        dataS.count === dataV.count &&
          dataV.count === dataA.count &&
          JSON.stringify(dataS.data.map((d) => d._id)) === JSON.stringify(dataA.data.map((d) => d._id)),
        "25. Cross-role consistency: Student, Volunteer, and Admin receive identical gallery data from MongoDB"
      );
    }

  } catch (error) {
    console.error("Test execution error:", error);
    failed++;
  } finally {
    server.close();
    await mongoose.disconnect();
    console.log("\n====================================================");
    console.log(`Phase 7 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("====================================================");
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests();
