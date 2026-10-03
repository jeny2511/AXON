# AXON — College Event & Community Management System
> **Official platform for The Cyber Force (TCF), Vishwakarma Government Engineering College (VGEC)**

---

## 📌 1. Project Overview
**AXON** is an enterprise-grade, full-stack event and community management system designed for college technical clubs and institutional organizations. It provides a unified digital infrastructure with strict Role-Based Access Control (RBAC) across three distinct user roles:

1. **Student:** Browse events, verify eligibility, register, generate dynamic QR codes, track verified attendance, submit feedback, view learning resources, and receive cryptographically verified certificates.
2. **Volunteer (Staff):** Manage event logistics, verify registrations, scan student QR codes in real-time, record manual attendance, track assigned operational tasks, and manage event photo galleries.
3. **Admin (Executive):** Platform oversight, user & volunteer provisioning, event lifecycle management (Draft $\rightarrow$ Published $\rightarrow$ Ongoing $\rightarrow$ Completed), attendance audits, certificate generation, system performance analytics, and global system configuration.

---

## 🛠️ 2. Technology Stack

- **Frontend:** React 19, Vite 8, React Router v7, Lucide Icons, Vanilla CSS Design System.
- **Backend:** Node.js, Express.js (ES Modules), RESTful Architecture.
- **Database:** MongoDB, Mongoose ODM (Atomic operations, Compound Unique Indexes).
- **Authentication & Security:** JWT (JSON Web Tokens in Authorization Header), Bcrypt.js (Salt factor 10), Server-Side Cryptographic OTPs, Strict RBAC Middleware.

---

## 📁 3. Project Structure

```text
AXON/
├── client/                     # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── admin/             # Admin Module Pages & Layouts
│   │   │   └── pages/         # Dashboard, Events, Participants, Attendance, Volunteers, etc.
│   │   ├── volunteer/         # Volunteer Module Pages & Layouts
│   │   │   └── pages/         # Dashboard, Tasks, Attendance, Registrations, Gallery, etc.
│   │   ├── student/           # Student Module Pages
│   │   │   └── pages/         # Dashboard, UpcomingEvents, RegisteredEvents, Attendance, etc.
│   │   ├── components/        # ProtectedRoute, Shared UI Components
│   │   ├── services/          # Real Backend API Integration Clients (apiClient, authService, etc.)
│   │   ├── pages/             # Unified Login (CommonLogin.jsx)
│   │   ├── App.jsx            # Main Router & Role Guarding
│   │   └── main.jsx           # Application Root
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend API Server (Node.js + Express)
│   ├── config/                # Database Connection (connectDB.js)
│   ├── controllers/           # Business Logic & Request Handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── eventController.js
│   │   ├── registrationController.js
│   │   ├── attendanceController.js
│   │   ├── feedbackController.js
│   │   ├── certificateController.js
│   │   ├── galleryController.js
│   │   ├── learningController.js
│   │   ├── volunteerController.js
│   │   └── adminController.js
│   ├── middleware/            # Security Middleware (authMiddleware, roleMiddleware, errorMiddleware)
│   ├── models/                # Mongoose Schemas & Database Models
│   ├── routes/                # Modular REST API Route Handlers
│   ├── utils/                 # JWT Token Generators, Seeding Utilities
│   ├── server.js              # Express Entrypoint
│   └── package.json
└── README.md                  # Project Documentation
```

---

## 🚀 4. Setup & Startup Instructions

### Prerequisites
- Node.js (v18.x or v20.x+)
- MongoDB (Local instance at `mongodb://127.0.0.1:27017/axon` or MongoDB Atlas URI)

### Step 1: Clone and Configure Environment Variables

1. **Server Configuration (`server/.env`):**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://127.0.0.1:27017/axon
   JWT_SECRET=axon_jwt_super_secret_key_development_2026
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:5173
   ```

2. **Client Configuration (`client/.env`):**
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

### Step 2: Install Dependencies & Start Server

1. **Start Backend Server:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Backend will start on `http://localhost:5000` and automatically verify the default admin account.*

2. **Start Frontend Application:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Frontend will start on `http://localhost:5173`.*

---

## 🔑 5. Seeded Credentials & Role Access

On initial server startup, AXON automatically verifies or provisions the default administrator account:

| Role | Email / Identifier | Default Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@axon.edu` (or `ADM001`) | `admin123` | Full Platform Oversight & Management |
| **Volunteer** | Created by Admin via `/admin/add-volunteer` | Set by Admin | Event Duty, Task Tracking, Attendance Scanning |
| **Student** | Public Signup with College Email + OTP | Set by Student | Registration, Personal QR, Feedback, Certificates |

---

## 🔄 6. End-to-End Workflow Demonstration

1. **Admin creates Event:** Event details, department/year eligibility rules, registration windows, and maximum capacity limits are configured.
2. **Student Registers:** Student verifies eligibility and registers. Event capacity increments atomically, and a secure `StudentEventQR` token is generated.
3. **Staff Records Attendance:** During the active event window, Volunteer/Admin scans the student's dynamic QR code or enters enrollment number manually.
4. **Student Submits Feedback:** Verified attendees rate speaker, content, organization, and provide constructive reviews.
5. **Certificate Issuance & Verification:** Certificates are generated for verified attendees. Authenticity can be publicly validated by code at `/api/certificates/verify/:code`.

---

## 🧪 7. Running Automated Test Suites

The backend includes end-to-end regression test runners:

```bash
cd server
node test_phase2_runner.js          # Authentication & User Profiles (25 tests)
node test_phase3_runner.js          # Event Lifecycle Management (17 tests)
node test_phase4_runner.js          # Event Registration & QR Tokens (24 tests)
node test_phase5_runner.js          # Attendance & QR Scanning (24 tests)
node test_phase6_runner.js          # Feedback & Certificates (24 tests)
node test_phase7_runner.js          # Content Management & Learning Hub (25 tests)
node test_phase8_runner.js          # Volunteer Operations & Tasks (26 tests)
node test_phase9_runner.js          # Admin Operations & System Stats (44 tests)
node test_phase10_audit_runner.js   # Full System Security & Isolation Audit (28 tests)
```
**Total Verified Test Coverage: 243 / 243 Passed (100%)**

---

## 📄 License & Ownership
Developed for **The Cyber Force (TCF)**, Department of Information Technology, **Vishwakarma Government Engineering College (VGEC)**.
