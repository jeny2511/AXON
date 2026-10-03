import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

// Load environment variables
dotenv.config();

// Models & routes
import User from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import { registrationOtpStore } from "./controllers/authController.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use(notFound);
app.use(errorHandler);

let server;
const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

async function runTests() {
  console.log("==================================================");
  console.log("AXON — PHASE 2 COMPREHENSIVE VERIFICATION SUITE");
  console.log("==================================================");

  // Connect to DB
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/axon");
  console.log("✅ [DB] Connected to MongoDB");

  // Clean test collection or seed
  await User.deleteMany({ email: { $in: [
    "student_test@vgec.ac.in",
    "student_test2@vgec.ac.in",
    "student_role_hack@vgec.ac.in",
    "student_pw_change@vgec.ac.in",
    "volunteer_test@vgec.ac.in",
    "otp_test@vgec.ac.in"
  ] } });

  // Ensure default admin seeded
  await User.seedDefaultAdmin();
  console.log("✅ [DB] Admin Seeding verified");

  // Create a volunteer for testing login
  await User.create({
    fullName: "Volunteer Tester",
    email: "volunteer_test@vgec.ac.in",
    enrollmentNumber: "220130107999",
    password: "Password@123",
    department: "IT",
    phoneNumber: "9876543210",
    batch: { startYear: 2022, endYear: 2026 },
    profilePhoto: "https://example.com/volunteer.png",
    committeePosition: new mongoose.Types.ObjectId(),
    role: "volunteer",
    designation: "Event Lead",
    accountStatus: "active"
  });

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

  // 1. Server OTP generation
  let generatedOtp = "";
  await test("1. POST /api/auth/send-otp (Generates server-side OTP)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "student_test@vgec.ac.in" })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) throw new Error(`Status ${res.status}: ${json.message}`);
    const record = registrationOtpStore.get("student_test@vgec.ac.in");
    if (!record || !record.otp) throw new Error("OTP was not saved in server-side registration store");
    generatedOtp = record.otp;
  });

  // 2. Student Registration with invalid OTP
  await test("2. POST /api/auth/register with invalid OTP fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Student",
        email: "student_test@vgec.ac.in",
        enrollmentNumber: "220130107001",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456780",
        otp: "000000" // wrong
      })
    });
    const json = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 2b. Student Registration with expired OTP
  await test("2b. POST /api/auth/register with expired OTP fails (400)", async () => {
    registrationOtpStore.set("otp_expired_test@vgec.ac.in", {
      otp: "123456",
      expiresAt: Date.now() - 1000 // expired
    });
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Expired OTP Student",
        email: "otp_expired_test@vgec.ac.in",
        enrollmentNumber: "220130107777",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456788",
        otp: "123456"
      })
    });
    const json = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400 for expired OTP, got ${res.status}`);
  });

  // 2c. Student Registration with fake client OTP
  await test("2c. POST /api/auth/register with client-generated fake OTP fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Fake OTP Student",
        email: "unregistered_fake@vgec.ac.in",
        enrollmentNumber: "220130107778",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456789",
        otp: "999999"
      })
    });
    const json = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 3. Student Registration with valid server OTP
  let studentToken = "";
  await test("3. POST /api/auth/register with valid server OTP succeeds (201)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Student",
        email: "student_test@vgec.ac.in",
        enrollmentNumber: "220130107001",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456780",
        otp: generatedOtp
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 201 || !json.data?.token) throw new Error(`Expected 201 with token, got ${res.status}: ${json.message}`);
    if (user.role !== "student") throw new Error(`Expected role 'student', got '${user.role}'`);
    studentToken = json.data.token;
  });

  // 4. Duplicate email registration fails
  await test("4. POST /api/auth/register duplicate email fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Student 2",
        email: "student_test@vgec.ac.in", // duplicate email
        enrollmentNumber: "220130107002",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456781"
      })
    });
    const json = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 5. Duplicate enrollment registration fails
  await test("5. POST /api/auth/register duplicate enrollment number fails (400)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Student 2",
        email: "student_test2@vgec.ac.in",
        enrollmentNumber: "220130107001", // duplicate enrollment
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456781"
      })
    });
    const json = await res.json();
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  // 6. Registration attempting role='admin' forces 'student'
  await test("6. POST /api/auth/register attempting role='admin' forces role='student'", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Role Hacker",
        email: "student_role_hack@vgec.ac.in",
        enrollmentNumber: "220130107998",
        password: "Password@123",
        department: "IT",
        year: 2,
        semester: 4,
        phone: "9123456782",
        role: "admin" // attempting hack
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}: ${json.message}`);
    if (user.role !== "student") throw new Error(`Security breach! Role created as ${user.role}`);
    const dbUser = await User.findOne({ email: "student_role_hack@vgec.ac.in" });
    if (dbUser.role !== "student") throw new Error(`DB user role is ${dbUser.role}`);
  });

  // 7. Login student by Email
  await test("7. POST /api/auth/login Student by Email succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_test@vgec.ac.in",
        password: "Password@123"
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.role !== "student") throw new Error(`Expected 200 role 'student', got ${res.status}`);
  });

  // 8. Login student by Enrollment Number
  await test("8. POST /api/auth/login Student by Enrollment Number succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "220130107001",
        password: "Password@123"
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.role !== "student") throw new Error(`Expected 200 role 'student', got ${res.status}`);
  });

  // 9. Login Volunteer
  let volunteerToken = "";
  await test("9. POST /api/auth/login Volunteer succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "volunteer_test@vgec.ac.in",
        password: "Password@123"
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.role !== "volunteer") throw new Error(`Expected 200 role 'volunteer', got ${res.status}`);
    volunteerToken = json.data.token;
  });

  // 10. Login Admin (Seeded default admin)
  let adminToken = "";
  await test("10. POST /api/auth/login Seeded Default Admin succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin@axon.demo",
        password: "Admin@123"
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.role !== "admin") throw new Error(`Expected 200 role 'admin', got ${res.status}: ${json.message}`);
    adminToken = json.data.token;
  });

  // 11. Login with wrong password
  await test("11. POST /api/auth/login with wrong password fails (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "admin@axon.demo",
        password: "WrongPassword999"
      })
    });
    const json = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 12. Login with unknown user
  await test("12. POST /api/auth/login with unknown user fails (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "nonexistent@vgec.ac.in",
        password: "SomePassword123"
      })
    });
    const json = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 13. GET /api/auth/me with valid token
  await test("13. GET /api/auth/me with valid Bearer token returns authenticated user (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.email !== "student_test@vgec.ac.in") {
      throw new Error(`Expected 200 with student email, got ${res.status}`);
    }
  });

  // 14. GET /api/auth/me without token
  await test("14. GET /api/auth/me without token fails (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    const json = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 15. GET /api/auth/me with invalid token
  await test("15. GET /api/auth/me with invalid token fails (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer invalid_token_xyz` }
    });
    const json = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 16. Profile GET
  await test("16. GET /api/users/profile returns current user profile (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.fullName !== "Test Student") {
      throw new Error(`Expected 200, got ${res.status}`);
    }
  });

  // 17. Profile UPDATE
  await test("17. PUT /api/users/profile updates allowed fields (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        fullName: "Updated Test Student",
        phone: "9988776655",
        bio: "Passionate cybersecurity enthusiast"
      })
    });
    const json = await res.json();
    const user = json.data?.user || json.data;
    if (res.status !== 200 || user.fullName !== "Updated Test Student") {
      throw new Error(`Expected 200 updated name, got ${res.status}`);
    }
    const dbUser = await User.findOne({ email: "student_test@vgec.ac.in" });
    if (dbUser.fullName !== "Updated Test Student" || dbUser.phoneNumber !== "9988776655") {
      throw new Error("Database was not updated");
    }
  });

  // 18. Profile UPDATE attempting to modify protected fields (role, accountStatus)
  await test("18. PUT /api/users/profile ignores attempt to change role or accountStatus", async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        role: "admin",
        accountStatus: "suspended",
        isDeleted: true
      })
    });
    const json = await res.json();
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const dbUser = await User.findOne({ email: "student_test@vgec.ac.in" });
    if (dbUser.role !== "student" || dbUser.accountStatus !== "active" || dbUser.isDeleted !== false) {
      throw new Error("Security breach: protected fields were modified!");
    }
  });

  // 19. Change password
  await test("19. PUT /api/users/change-password changes user password (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/users/change-password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        currentPassword: "Password@123",
        newPassword: "NewBrandPassword@456"
      })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.success) {
      throw new Error(`Expected 200, got ${res.status}: ${json.message}`);
    }
  });

  // 20. Old password fails after change
  await test("20. Old password fails after change (401)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_test@vgec.ac.in",
        password: "Password@123" // old password
      })
    });
    const json = await res.json();
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 21. New password succeeds
  await test("21. New password succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: "student_test@vgec.ac.in",
        password: "NewBrandPassword@456" // new password
      })
    });
    const json = await res.json();
    if (res.status !== 200 || !json.data.token) throw new Error(`Expected 200, got ${res.status}`);
  });

  // 22. RBAC check: Student accessing /api/users/volunteers fails (403)
  await test("22. RBAC: Student accessing GET /api/users/volunteers fails (403)", async () => {
    const res = await fetch(`${BASE_URL}/api/users/volunteers`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const json = await res.json();
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
  });

  // 23. RBAC check: Admin accessing /api/users/volunteers succeeds (200)
  await test("23. RBAC: Admin accessing GET /api/users/volunteers succeeds (200)", async () => {
    const res = await fetch(`${BASE_URL}/api/users/volunteers`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data)) throw new Error(`Expected 200, got ${res.status}`);
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

runTests().catch((err) => {
  console.error("FATAL TEST ERROR:", err);
  if (server) server.close();
  process.exit(1);
});
