import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import All Models
import {
  User,
  Branch,
  CommitteePosition,
  Event,
  Registration,
  StudentEventQR,
  Attendance,
  Feedback,
  FeedbackForm,
  Certificate,
  CertificateTemplate,
  Gallery,
  LearningResource,
  Notification,
  Report,
  GlobalSettings,
  AboutTCF,
  AuditLog,
} from "../models/index.js";

/**
 * AXON Full Database Seeder
 * Populates all 17 collections with rich, realistic, interconnected GTU/VGEC data.
 */
async function seedDatabase() {
  console.log("🌱 ========================================================");
  console.log("🌱 [AXON Seeder] Starting Full Database Initialization...");
  console.log("🌱 ========================================================");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ [AXON Seeder] Error: MONGO_URI is not defined in server/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("✅ [AXON Seeder] Connected to MongoDB Atlas successfully.\n");

    // -----------------------------------------------------------------------
    // STEP 1: CLEAN EXISTING COLLECTIONS
    // -----------------------------------------------------------------------
    console.log("🧹 [1/12] Cleaning previous data...");
    await Promise.all([
      User.deleteMany({}),
      Branch.deleteMany({}),
      CommitteePosition.deleteMany({}),
      Event.deleteMany({}),
      Registration.deleteMany({}),
      StudentEventQR.deleteMany({}),
      Attendance.deleteMany({}),
      Feedback.deleteMany({}),
      FeedbackForm.deleteMany({}),
      Certificate.deleteMany({}),
      CertificateTemplate.deleteMany({}),
      Gallery.deleteMany({}),
      LearningResource.deleteMany({}),
      Notification.deleteMany({}),
      Report.deleteMany({}),
      GlobalSettings.deleteMany({}),
      AboutTCF.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);
    console.log("✅ Previous collections purged.\n");

    // -----------------------------------------------------------------------
    // STEP 2: SEED BRANCHES & COMMITTEE POSITIONS
    // -----------------------------------------------------------------------
    console.log("🏛️ [2/12] Seeding Branches & Committee Positions...");
    const branches = await Branch.insertMany([
      { name: "Information Technology", shortName: "IT", isActive: true },
      { name: "Computer Engineering", shortName: "CE", isActive: true },
      { name: "Information & Communication Technology", shortName: "ICT", isActive: true },
      { name: "Electronics & Communication", shortName: "EC", isActive: true },
      { name: "Mechanical Engineering", shortName: "ME", isActive: true },
      { name: "Civil Engineering", shortName: "CL", isActive: true },
    ]);

    const itBranch = branches.find((b) => b.shortName === "IT");
    const ceBranch = branches.find((b) => b.shortName === "CE");
    const ictBranch = branches.find((b) => b.shortName === "ICT");
    const ecBranch = branches.find((b) => b.shortName === "EC");

    const committeePositions = await CommitteePosition.insertMany([
      { name: "President", description: "Executive leadership & organization governance", isActive: true },
      { name: "Vice President", description: "Operations & event supervision", isActive: true },
      { name: "Technical Lead", description: "Platform development & cybersecurity workshops", isActive: true },
      { name: "Event Coordinator", description: "Planning, logistics & venue coordination", isActive: true },
      { name: "Operations Lead", description: "On-ground execution & volunteer workflows", isActive: true },
      { name: "Media & PR Head", description: "Publicity, social media & creative direction", isActive: true },
    ]);
    console.log(`✅ Seeded ${branches.length} Branches & ${committeePositions.length} Committee Positions.\n`);

    // -----------------------------------------------------------------------
    // STEP 3: SEED USERS (Admin, Volunteers, Students)
    // -----------------------------------------------------------------------
    console.log("👥 [3/12] Seeding Users with Passwords...");

    // 1) Admins
    const adminUser = await User.create({
      fullName: "Ishika Patel",
      email: "ishika@vgec.ac.in",
      password: "Admin@123",
      role: "admin",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130109001",
      phoneNumber: "9876543230",
      batch: { startYear: 2024, endYear: 2028 },
      profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 3,
        currentSemester: 5,
        batch: { startYear: 2024, endYear: 2028 },
      },
    });

    const superAdmin = await User.create({
      fullName: "AXON System Admin",
      email: "admin@axon.edu",
      password: "Admin@123",
      role: "admin",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "ADMIN001",
      phoneNumber: "9876543200",
      batch: { startYear: 2023, endYear: 2027 },
      profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 4,
        currentSemester: 8,
        batch: { startYear: 2023, endYear: 2027 },
      },
    });

    // 2) Volunteers
    const techLeadPos = committeePositions.find((p) => p.name === "Technical Lead");
    const presidentPos = committeePositions.find((p) => p.name === "President");
    const opsLeadPos = committeePositions.find((p) => p.name === "Operations Lead");

    const volunteerPreyas = await User.create({
      fullName: "Preyas Shah",
      email: "preyas@vgec.ac.in",
      password: "Volunteer@123",
      role: "volunteer",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130108001",
      phoneNumber: "9876543220",
      batch: { startYear: 2024, endYear: 2028 },
      profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      committeePosition: techLeadPos._id,
      createdBy: adminUser._id,
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 3,
        currentSemester: 5,
        batch: { startYear: 2024, endYear: 2028 },
      },
    });

    const volunteerDhruvi = await User.create({
      fullName: "Dhruvi Patel",
      email: "dhruvi@vgec.ac.in",
      password: "Volunteer@123",
      role: "volunteer",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130108002",
      phoneNumber: "9876543221",
      batch: { startYear: 2024, endYear: 2028 },
      profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      committeePosition: presidentPos._id,
      createdBy: adminUser._id,
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 3,
        currentSemester: 5,
        batch: { startYear: 2024, endYear: 2028 },
      },
    });

    const volunteerYash = await User.create({
      fullName: "Yash Mehta",
      email: "yash@vgec.ac.in",
      password: "Volunteer@123",
      role: "volunteer",
      department: "CE",
      branch: ceBranch._id,
      enrollmentNumber: "220130108003",
      phoneNumber: "9876543222",
      batch: { startYear: 2023, endYear: 2027 },
      profilePhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80",
      committeePosition: opsLeadPos._id,
      createdBy: adminUser._id,
      academicDetails: {
        admissionType: "regular",
        department: "CE",
        currentYear: 4,
        currentSemester: 7,
        batch: { startYear: 2023, endYear: 2027 },
      },
    });

    // 3) Students
    const studentJeny = await User.create({
      fullName: "Jeny Thesiya",
      email: "jeny@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130107054",
      phoneNumber: "9876543210",
      batch: { startYear: 2024, endYear: 2028 },
      profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 3,
        currentSemester: 5,
        batch: { startYear: 2024, endYear: 2028 },
      },
    });

    const studentArchi = await User.create({
      fullName: "Archi Patel",
      email: "archi@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130107055",
      phoneNumber: "9876543211",
      batch: { startYear: 2024, endYear: 2028 },
      profilePhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 3,
        currentSemester: 5,
        batch: { startYear: 2024, endYear: 2028 },
      },
    });

    const studentRiya = await User.create({
      fullName: "Riya Shah",
      email: "riya@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "CE",
      branch: ceBranch._id,
      enrollmentNumber: "220130107056",
      phoneNumber: "9876543212",
      batch: { startYear: 2025, endYear: 2029 },
      profilePhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "CE",
        currentYear: 2,
        currentSemester: 3,
        batch: { startYear: 2025, endYear: 2029 },
      },
    });

    const studentMeet = await User.create({
      fullName: "Meet Parmar",
      email: "meet@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "ICT",
      branch: ictBranch._id,
      enrollmentNumber: "220130107057",
      phoneNumber: "9876543213",
      batch: { startYear: 2023, endYear: 2027 },
      profilePhoto: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "ICT",
        currentYear: 4,
        currentSemester: 7,
        batch: { startYear: 2023, endYear: 2027 },
      },
    });

    const studentKrishna = await User.create({
      fullName: "Krishna Joshi",
      email: "krishna@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "IT",
      branch: itBranch._id,
      enrollmentNumber: "220130107058",
      phoneNumber: "9876543214",
      batch: { startYear: 2025, endYear: 2029 },
      profilePhoto: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "IT",
        currentYear: 2,
        currentSemester: 3,
        batch: { startYear: 2025, endYear: 2029 },
      },
    });

    const studentHarsh = await User.create({
      fullName: "Harsh Patel",
      email: "harsh@vgec.ac.in",
      password: "Student@123",
      role: "student",
      department: "EC",
      branch: ecBranch._id,
      enrollmentNumber: "220130107059",
      phoneNumber: "9876543215",
      batch: { startYear: 2026, endYear: 2030 },
      profilePhoto: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=300&q=80",
      academicDetails: {
        admissionType: "regular",
        department: "EC",
        currentYear: 1,
        currentSemester: 1,
        batch: { startYear: 2026, endYear: 2030 },
      },
    });

    console.log("✅ Seeded 2 Admins, 3 Volunteers, and 6 Students.\n");

    // -----------------------------------------------------------------------
    // STEP 4: GLOBAL SETTINGS & CERTIFICATE TEMPLATE
    // -----------------------------------------------------------------------
    console.log("⚙️ [4/12] Seeding Global Configuration Settings & Certificate Template...");
    await GlobalSettings.create({
      key: "system_settings",
      qr: {
        enabled: true,
        biometricEnabled: true,
        uniquePerStudentPerEvent: true,
        tokenRandomizationEnabled: true,
        expiryMinutes: 15,
      },
      attendance: {
        allowManualAttendance: true,
        manualAttendanceIdentifier: "enrollmentNumber",
        oneAttendancePerStudentPerEvent: true,
        continuousQRScanning: true,
        allowSecondScan: false,
      },
      academic: {
        promotionMonth: 7,
        promotionDescription: "manual_by_admin_every_july",
        batchFormat: "YYYY-YY",
      },
      registration: {
        publicStudentRegistration: true,
        volunteerCreatedByAdmin: true,
        waitingListEnabled: false,
        registrationCloseByDate: true,
        registrationCloseByParticipantLimit: true,
        allowRegistrationReopen: true,
      },
      security: {
        passwordHashing: "bcrypt",
        authentication: "JWT",
        auditLogging: true,
      },
    });

    const certTemplate = await CertificateTemplate.create({
      name: "Default AXON Event Certificate Template",
      templateFile: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80",
      placeholders: ["studentName", "enrollmentNumber", "eventName", "date"],
      isActive: true,
      updatedBy: adminUser._id,
    });
    console.log("✅ Global settings & certificate template configured.\n");

    // -----------------------------------------------------------------------
    // STEP 5: SEED EVENTS
    // -----------------------------------------------------------------------
    console.log("📅 [5/12] Seeding Upcoming, Ongoing, and Completed Events...");
    const now = new Date();
    const futureDate1 = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 days
    const futureDate2 = new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000); // +25 days
    const pastDate1 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);   // -20 days
    const pastDate2 = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);   // -40 days

    // Event 1: Upcoming CTF (Status: registration_open)
    const eventCTF = await Event.create({
      name: "Capture The Flag 2027",
      category: "Competition",
      status: "registration_open",
      description: "National-level Capture The Flag competition organized by The Cyber Force (TCF) where participants solve real cybersecurity challenges, cryptography puzzles, and reverse engineering tasks.",
      venue: "VGEC Seminar Hall, A-Block",
      date: futureDate1,
      startTime: "02:00 PM",
      endTime: "05:00 PM",
      poster: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80",
      speaker: "Rahul Sharma (Security Analyst, CERT-In)",
      registration: {
        openAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        closeAt: new Date(futureDate1.getTime() - 12 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: futureDate1,
        closeAt: new Date(futureDate1.getTime() + 4 * 60 * 60 * 1000),
      },
      participantsLimit: 200,
      eligibility: {
        enabled: true,
        years: [2, 3, 4],
        branchCodes: ["IT", "CE", "ICT"],
      },
      certificateAvailable: false,
      feedbackRequired: true,
      createdBy: adminUser._id,
      assignedVolunteers: [volunteerPreyas._id, volunteerDhruvi._id],
    });

    // Event 2: Upcoming Bug Bounty (Status: registration_open)
    const eventBugBounty = await Event.create({
      name: "Bug Bounty Bootcamp & Web Defense",
      category: "Workshop",
      status: "registration_open",
      description: "Hands-on workshop introducing bug bounty hunting, responsible disclosure methodologies, Burp Suite fundamentals, and vulnerability reporting.",
      venue: "Computer Lab 3, IT Dept",
      date: futureDate2,
      startTime: "10:00 AM",
      endTime: "01:00 PM",
      poster: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
      speaker: "Priya Patel (HackerOne Top 100 Researcher)",
      registration: {
        openAt: now,
        closeAt: new Date(futureDate2.getTime() - 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: futureDate2,
        closeAt: new Date(futureDate2.getTime() + 4 * 60 * 60 * 1000),
      },
      participantsLimit: 120,
      eligibility: {
        enabled: false,
        years: [1, 2, 3, 4],
        branchCodes: [],
      },
      certificateAvailable: false,
      feedbackRequired: true,
      createdBy: volunteerPreyas._id,
      assignedVolunteers: [volunteerPreyas._id, volunteerYash._id],
    });

    // Event 3: Ongoing Event (Status: ongoing)
    const eventLinux = await Event.create({
      name: "Linux & Kali Hands-on Workshop",
      category: "Workshop",
      status: "ongoing",
      description: "Live practical session on Linux shell mastery, Kali Linux security distribution, network packet analysis with Wireshark, and defensive hardening.",
      venue: "Cyber Security Lab, Ground Floor",
      date: now,
      startTime: "11:00 AM",
      endTime: "04:00 PM",
      poster: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80",
      speaker: "Om Mehta (Linux Foundation Fellow)",
      registration: {
        openAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        closeAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        closeAt: new Date(now.getTime() + 6 * 60 * 60 * 1000),
      },
      participantsLimit: 80,
      eligibility: {
        enabled: true,
        years: [2, 3],
        branchCodes: ["IT", "CE", "ICT"],
      },
      certificateAvailable: false,
      feedbackRequired: true,
      createdBy: volunteerPreyas._id,
      assignedVolunteers: [volunteerPreyas._id],
    });

    // Event 4: Completed Event (Status: completed)
    const eventSIH = await Event.create({
      name: "Smart India Hackathon Internal Round 2027",
      category: "Hackathon",
      status: "completed",
      description: "Internal Smart India Hackathon idea pitching and working prototype selection round for college representation.",
      venue: "Innovation & Incubation Hub, VGEC",
      date: pastDate1,
      startTime: "09:00 AM",
      endTime: "06:00 PM",
      poster: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80",
      speaker: "Faculty Jury Panel",
      registration: {
        openAt: new Date(pastDate1.getTime() - 15 * 24 * 60 * 60 * 1000),
        closeAt: new Date(pastDate1.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: pastDate1,
        closeAt: new Date(pastDate1.getTime() + 10 * 60 * 60 * 1000),
      },
      participantsLimit: 150,
      eligibility: {
        enabled: true,
        years: [2, 3, 4],
        branchCodes: ["IT", "CE", "ICT", "EC"],
      },
      certificateAvailable: true,
      feedbackRequired: true,
      createdBy: adminUser._id,
      assignedVolunteers: [volunteerPreyas._id, volunteerDhruvi._id],
    });

    // Event 5: Completed Event (Status: completed)
    const eventPhishing = await Event.create({
      name: "Phishing & Social Engineering Awareness Conclave",
      category: "Seminar",
      status: "completed",
      description: "Interactive cybersecurity awareness session teaching practical defense strategies against spear phishing, clone phishing, and MFA bypass attacks.",
      venue: "VGEC Main Auditorium",
      date: pastDate2,
      startTime: "11:00 AM",
      endTime: "01:00 PM",
      poster: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
      speaker: "Neha Shah (Cyber Crime Branch Advisor)",
      registration: {
        openAt: new Date(pastDate2.getTime() - 10 * 24 * 60 * 60 * 1000),
        closeAt: new Date(pastDate2.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      attendance: {
        openAt: pastDate2,
        closeAt: new Date(pastDate2.getTime() + 3 * 60 * 60 * 1000),
      },
      participantsLimit: 300,
      eligibility: {
        enabled: false,
        years: [1, 2, 3, 4],
        branchCodes: [],
      },
      certificateAvailable: true,
      feedbackRequired: true,
      createdBy: adminUser._id,
      assignedVolunteers: [volunteerYash._id],
    });
    console.log("✅ Seeded 5 Events (Upcoming, Ongoing, Completed).\n");

    // -----------------------------------------------------------------------
    // STEP 6: SEED REGISTRATIONS & STUDENT EVENT QR PASSES
    // -----------------------------------------------------------------------
    console.log("🎫 [6/12] Generating Event Registrations & Secure QR Pass Tokens...");
    const registrationData = [
      // Upcoming CTF registrations
      { student: studentJeny, event: eventCTF },
      { student: studentArchi, event: eventCTF },
      { student: studentMeet, event: eventCTF },

      // Bug Bounty registrations
      { student: studentRiya, event: eventBugBounty },
      { student: studentKrishna, event: eventBugBounty },

      // Ongoing Linux workshop registrations
      { student: studentJeny, event: eventLinux },
      { student: studentHarsh, event: eventLinux },

      // Past SIH registrations
      { student: studentJeny, event: eventSIH },
      { student: studentArchi, event: eventSIH },
      { student: studentMeet, event: eventSIH },

      // Past Phishing registrations
      { student: studentJeny, event: eventPhishing },
      { student: studentRiya, event: eventPhishing },
      { student: studentKrishna, event: eventPhishing },
    ];

    const seededRegistrationsMap = new Map();

    for (const reg of registrationData) {
      const qrToken = `AXON-PASS-${reg.event._id.toString().slice(-4)}-${reg.student._id.toString().slice(-4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const newReg = await Registration.create({
        studentId: reg.student._id,
        eventId: reg.event._id,
        qrCode: qrToken,
        status: "registered",
        registeredAt: new Date(reg.event.registration.openAt.getTime() + 1000 * 60 * 60),
      });

      await StudentEventQR.create({
        studentId: reg.student._id,
        eventId: reg.event._id,
        registrationId: newReg._id,
        token: qrToken,
        active: true,
        expiresAt: reg.event.attendance.closeAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const key = `${reg.student._id}_${reg.event._id}`;
      seededRegistrationsMap.set(key, newReg);
    }
    console.log(`✅ Seeded ${registrationData.length} Registrations with Cryptographic QR Tokens.\n`);

    // -----------------------------------------------------------------------
    // STEP 7: SEED ATTENDANCE RECORDS (For Past Events)
    // -----------------------------------------------------------------------
    console.log("📋 [7/12] Recording Verified Physical Attendances...");
    const attendees = [
      // SIH Event Attendees
      { student: studentJeny, event: eventSIH },
      { student: studentArchi, event: eventSIH },
      { student: studentMeet, event: eventSIH },

      // Phishing Awareness Attendees
      { student: studentJeny, event: eventPhishing },
      { student: studentRiya, event: eventPhishing },
    ];

    for (const att of attendees) {
      const key = `${att.student._id}_${att.event._id}`;
      const regDoc = seededRegistrationsMap.get(key);

      await Attendance.create({
        studentId: att.student._id,
        eventId: att.event._id,
        registrationId: regDoc._id,
        markedBy: volunteerPreyas._id,
        method: "qr",
        status: "present",
        attendanceTime: new Date(att.event.date.getTime() + 15 * 60 * 1000),
      });

      // Mark QR as inactive/used
      await StudentEventQR.updateOne(
        { studentId: att.student._id, eventId: att.event._id },
        { active: false }
      );
    }
    console.log(`✅ Recorded ${attendees.length} Verified Attendances.\n`);

    // -----------------------------------------------------------------------
    // STEP 8: SEED FEEDBACK FORMS & STUDENT SUBMISSIONS
    // -----------------------------------------------------------------------
    console.log("💬 [8/12] Seeding Feedback Forms & Student Reviews...");
    await FeedbackForm.create({
      eventId: eventSIH._id,
      title: "SIH Internal Round 2027 Feedback Form",
      questions: [
        {
          question: "How satisfied were you with the judging transparency?",
          type: "rating",
          scale: 5,
          required: true,
          isActive: true,
        },
        {
          question: "Did the problem statements stimulate innovative technical solutions?",
          type: "rating",
          scale: 5,
          required: true,
          isActive: true,
        },
        {
          question: "Share your overall feedback or suggestions for next edition",
          type: "textarea",
          required: false,
          isActive: true,
        },
      ],
      createdBy: adminUser._id,
      isActive: true,
    });

    // Seed feedback from Jeny & Archi (both attended SIH)
    await Feedback.create({
      eventId: eventSIH._id,
      studentId: studentJeny._id,
      overallRating: 5,
      speakerRating: 5,
      organizationRating: 5,
      contentRating: 5,
      wouldRecommend: true,
      comment: "The hackathon environment was intense, well-organized, and the mentor feedback helped refine our prototype architecture significantly!",
    });

    await Feedback.create({
      eventId: eventSIH._id,
      studentId: studentArchi._id,
      overallRating: 5,
      speakerRating: 4,
      organizationRating: 5,
      contentRating: 5,
      wouldRecommend: true,
      comment: "Exceptional logistical coordination by the volunteers. Smooth WiFi and lab setup throughout.",
    });
    console.log("✅ Seeded Feedback Forms and Verified Student Submissions.\n");

    // -----------------------------------------------------------------------
    // STEP 9: SEED CERTIFICATES
    // -----------------------------------------------------------------------
    console.log("🎓 [9/12] Generating Issued Certificates & Public Verification Codes...");
    await Certificate.create({
      studentId: studentJeny._id,
      eventId: eventSIH._id,
      studentName: studentJeny.fullName,
      enrollmentNumber: studentJeny.enrollmentNumber,
      certificateTitle: "Certificate of Participation - Smart India Hackathon 2027",
      verificationCode: "AXON-CERT-2027-SIH-001",
      pdfUrl: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1200&q=80",
      status: "generated",
      sentAutomatically: true,
      generatedAt: new Date(pastDate1.getTime() + 2 * 24 * 60 * 60 * 1000),
    });

    await Certificate.create({
      studentId: studentArchi._id,
      eventId: eventSIH._id,
      studentName: studentArchi.fullName,
      enrollmentNumber: studentArchi.enrollmentNumber,
      certificateTitle: "Certificate of Participation - Smart India Hackathon 2027",
      verificationCode: "AXON-CERT-2027-SIH-002",
      pdfUrl: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1200&q=80",
      status: "generated",
      sentAutomatically: true,
      generatedAt: new Date(pastDate1.getTime() + 2 * 24 * 60 * 60 * 1000),
    });
    console.log("✅ Seeded Certificates with public verification codes.\n");

    // -----------------------------------------------------------------------
    // STEP 10: SEED EVENT REPORTS
    // -----------------------------------------------------------------------
    console.log("📑 [10/12] Seeding Event Reports & Admin Approval Audits...");
    await Report.create({
      eventId: eventSIH._id,
      uploadedBy: volunteerPreyas._id,
      reportUrl: "https://tcf.example.com/reports/sih-2027-final-summary.pdf",
      status: "approved",
      uploadedAt: new Date(pastDate1.getTime() + 3 * 24 * 60 * 60 * 1000),
      history: [
        {
          action: "uploaded",
          performedBy: volunteerPreyas._id,
          performedAt: new Date(pastDate1.getTime() + 3 * 24 * 60 * 60 * 1000),
          comment: "Initial submission of SIH internal hackathon report containing participant roster and winner teams.",
        },
        {
          action: "approved",
          performedBy: adminUser._id,
          performedAt: new Date(pastDate1.getTime() + 4 * 24 * 60 * 60 * 1000),
          comment: "Approved by Lead Administrator Ishika Patel. Excellent documentation and photo coverage.",
        },
      ],
    });
    console.log("✅ Seeded Approved Event Report.\n");

    // -----------------------------------------------------------------------
    // STEP 11: SEED GALLERY & LEARNING HUB
    // -----------------------------------------------------------------------
    console.log("🖼️ [11/12] Seeding Gallery Memories & Cybersecurity Learning Hub...");
    await Gallery.create({
      eventName: "Smart India Hackathon 2027 Moments",
      venue: "Innovation & Incubation Hub, VGEC",
      date: pastDate1,
      time: "09:00 - 18:00",
      description: "Highlights and project demos from the SIH internal coding marathon.",
      banner: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      ],
      tags: ["hackathon", "innovation", "coding", "vgec"],
      createdBy: volunteerPreyas._id,
    });

    await Gallery.create({
      eventName: "Phishing Awareness Conclave Highlights",
      venue: "VGEC Main Auditorium",
      date: pastDate2,
      time: "11:00 - 13:00",
      description: "Interactive session on cyber hygiene, password security, and social engineering defense.",
      banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80",
      photos: [
        "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
      ],
      tags: ["cybersecurity", "awareness", "seminar", "tcf"],
      createdBy: adminUser._id,
    });

    // Learning Resources
    await LearningResource.create({
      title: "Top 10 OWASP Web Application Vulnerabilities & Defense 2026",
      description: "In-depth guide covering Injection, Broken Access Control, Cryptographic Failures, and practical remediation methods.",
      category: "article",
      contentType: "article",
      content: "## Overview of OWASP Top 10\nSecurity in web architectures requires defense-in-depth principles...",
      readTime: "8 min read",
      tags: ["owasp", "web security", "ethical hacking"],
      isFeatured: true,
      author: "TCF Research Team",
      authorId: volunteerPreyas._id,
    });

    await LearningResource.create({
      title: "Wireshark Network Packet Analysis Quick Reference Cheat Sheet",
      description: "Essential display filters, packet dissection techniques, and TCP handshake troubleshooting commands.",
      category: "tool",
      contentType: "pdf",
      pdfUrl: "https://tcf.example.com/docs/wireshark-cheatsheet.pdf",
      readTime: "5 min read",
      tags: ["networking", "wireshark", "packet analysis"],
      isFeatured: true,
      author: "Preyas Shah",
      authorId: volunteerPreyas._id,
    });

    await LearningResource.create({
      title: "Ransomware Defense in Critical Infrastructure: A Post-Mortem",
      description: "Case study analyzing enterprise ransomware vector entry, lateral movement techniques, and air-gapped backup restoration.",
      category: "case study",
      contentType: "article",
      content: "## Incident Timeline & Analysis\nThe attack vector originated from an unpatched VPN appliance...",
      readTime: "12 min read",
      tags: ["ransomware", "case study", "incident response"],
      isFeatured: false,
      author: "Ishika Patel",
      authorId: adminUser._id,
    });
    console.log("✅ Seeded Gallery Albums & Cyber Learning Resources.\n");

    // -----------------------------------------------------------------------
    // STEP 12: ABOUT TCF, NOTIFICATIONS, & AUDIT LOGS
    // -----------------------------------------------------------------------
    console.log("📢 [12/12] Seeding Organization Info (About TCF) & Notifications...");
    await AboutTCF.create({
      organizationName: "The Cyber Force (TCF)",
      vision: "To establish a premier collegiate epicenter for cybersecurity education, ethical hacking excellence, and student-driven innovation across Gujarat Technological University.",
      mission: "To deliver hands-on technical masterclasses, capture-the-flag hackathons, and real-world defense simulations that empower future cyber defense professionals.",
      description: "The Cyber Force (TCF) is the premier student-led technical organization of Vishwakarma Government Engineering College (VGEC). Founded in 2022, TCF drives technical excellence through structured workshops, industrial collaborations, and national cyber defense competitions.",
      teamMembers: [
        {
          name: "Dhruvi Patel",
          role: "President",
          photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
          description: "Leading overall vision, college partnerships, and event management.",
          order: 1,
        },
        {
          name: "Preyas Shah",
          role: "Technical Lead",
          photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
          description: "Architecting workshop curricula, CTF infrastructure, and system engineering.",
          order: 2,
        },
        {
          name: "Ishika Patel",
          role: "Lead Administrator",
          photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
          description: "Overseeing executive approvals, member certification, and college compliance.",
          order: 3,
        },
      ],
      contactInfo: {
        email: "tcf@vgec.ac.in",
        phone: "+91 98765 43210",
        address: "Vishwakarma Government Engineering College, Chandkheda, Ahmedabad - 382424",
        website: "https://tcf.vgec.ac.in",
      },
      lastUpdatedBy: adminUser._id,
    });

    // Notifications for student Jeny
    await Notification.create({
      recipientId: studentJeny._id,
      title: "Registration Confirmed: Capture The Flag 2027",
      message: "You have successfully registered for Capture The Flag 2027. Your QR pass is available in My Events.",
      type: "upcoming_event",
      relatedEntityType: "event",
      relatedEntityId: eventCTF._id,
      read: false,
    });

    await Notification.create({
      recipientId: studentJeny._id,
      title: "Certificate Issued: SIH 2027",
      message: "Your participation certificate for Smart India Hackathon 2027 has been issued. View and download it from My Certificates.",
      type: "certificate_available",
      relatedEntityType: "certificate",
      read: true,
      readAt: new Date(),
    });

    // Sample Audit Log
    await AuditLog.create({
      performedBy: adminUser._id,
      action: "DATABASE_INITIALIZED",
      entityType: "system",
      description: "Full AXON database initialized with seed dataset",
    });

    console.log("✅ Seeded About TCF, Notifications & Audit Log.\n");

    console.log("========================================================");
    console.log("🎉 [AXON Seeder] FULL DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================================");
    console.log("\n🔑 DEFAULT CREDENTIALS FOR TESTING:");
    console.log("--------------------------------------------------------");
    console.log("👑 ADMIN:       ishika@vgec.ac.in    / Admin@123");
    console.log("👑 SUPERADMIN:  admin@axon.edu       / Admin@123");
    console.log("🤝 VOLUNTEER:   preyas@vgec.ac.in    / Volunteer@123");
    console.log("🤝 VOLUNTEER:   dhruvi@vgec.ac.in    / Volunteer@123");
    console.log("🎓 STUDENT:     jeny@vgec.ac.in      / Student@123");
    console.log("🎓 STUDENT:     archi@vgec.ac.in     / Student@123");
    console.log("--------------------------------------------------------\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ [AXON Seeder] Seeding Error:", error);
    process.exit(1);
  }
}

seedDatabase();
