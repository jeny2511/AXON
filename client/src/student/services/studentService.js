// Student Shared Service
import { aboutTCF as staticAboutTCF } from "../../mockData/about";

import eventService from "../../services/eventService";
import { registrationService } from "../../services/registrationService";
import { attendanceService } from "../../services/attendanceService";
import { feedbackService } from "../../services/feedbackService";
import { certificateService } from "../../services/certificateService";
import { galleryService } from "../../services/galleryService";
import { learningService } from "../../services/learningService";
import { getAuthUser } from "../../services/authService";

// Active student session helper (returns null for Guest Mode)
export function getActiveStudentId() {
  const user = getAuthUser();
  return user?.id || user?._id || localStorage.getItem("axon_auth_student_id") || null;
}

export function setActiveStudentId(studentId) {
  if (studentId) {
    localStorage.setItem("axon_auth_student_id", studentId);
  } else {
    localStorage.removeItem("axon_auth_student_id");
  }
}

// --------------------------------------------
// EVENTS (LIVE API INTEGRATION)
// --------------------------------------------

export async function fetchAllEventsApi(params = {}) {
  try {
    const res = await eventService.getEvents(params);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch events from API:", err);
    throw err;
  }
}

export async function fetchEventByIdApi(id) {
  try {
    const res = await eventService.getEventById(id);
    return res.data || null;
  } catch (err) {
    console.error(`Failed to fetch event ${id} from API:`, err);
    throw err;
  }
}

export function getAllEvents() {
  return [];
}

export async function fetchGalleryApi(params = {}) {
  try {
    const res = await galleryService.getGallery(params);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch gallery from API:", err);
    throw err;
  }
}

export async function fetchLearningResourcesApi(params = {}) {
  try {
    const res = await learningService.getResources(params);
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch learning resources from API:", err);
    throw err;
  }
}

export async function fetchLearningResourceByIdApi(id) {
  try {
    const res = await learningService.getResourceById(id);
    return res.data || null;
  } catch (err) {
    console.error(`Failed to fetch learning resource ${id} from API:`, err);
    throw err;
  }
}

export function getGallery() {
  return [];
}

export function getUpcomingEvents() {
  return [];
}

export function getOngoingEvents() {
  return [];
}

export function getCompletedEvents() {
  return [];
}

export function getEventById(eventId) {
  return null;
}

// --------------------------------------------
// REGISTRATIONS (LIVE API + HYDRATION)
// --------------------------------------------

// --------------------------------------------
// REGISTRATIONS (LIVE API + SYNCHRONOUS COMPATIBILITY)
// --------------------------------------------

export async function fetchMyRegistrationsApi() {
  try {
    const res = await registrationService.getMyRegistrations();
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch registrations from API:", err);
    throw err;
  }
}

export async function registerForEventApi(eventId) {
  try {
    const res = await registrationService.registerForEvent(eventId);
    return res.data;
  } catch (err) {
    console.error("Failed to register for event via API:", err);
    throw err;
  }
}

export async function cancelRegistrationApi(registrationId, reason = "") {
  try {
    const res = await registrationService.cancelRegistration(registrationId, reason);
    return res.data;
  } catch (err) {
    console.error("Failed to cancel registration via API:", err);
    throw err;
  }
}

export function getStudentRegistrations(studentId) {
  return [];
}

export function isStudentRegistered(studentId, eventId) {
  return false;
}

// Check mandatory business rules for registration eligibility
export function checkRegistrationEligibility(event, student) {
  if (!event || !student) {
    return { eligible: false, reason: "Invalid event or student data." };
  }

  // 1. Is event status open for registration?
  const allowedStatuses = ["published", "upcoming", "registration_open"];
  const status = (event.status || "published").toLowerCase();
  if (!allowedStatuses.includes(status)) {
    return {
      eligible: false,
      reason:
        status === "completed"
          ? "Event has already concluded."
          : status === "cancelled"
          ? "Event has been cancelled."
          : "Event registration is closed.",
    };
  }

  // 2. Has registration window opened yet?
  const now = new Date();
  const openAt = event.registration?.openAt || event.registrationOpen;
  if (openAt && now < new Date(openAt)) {
    return {
      eligible: false,
      reason: `Registration opens on ${new Date(openAt).toLocaleDateString()}.`,
    };
  }

  // 3. Has registration deadline passed?
  const closeAt = event.registration?.closeAt || event.registrationClose;
  if (closeAt && now > new Date(closeAt)) {
    return { eligible: false, reason: "Registration deadline has passed." };
  }

  // 4. Has capacity been reached?
  const limit = event.participantsLimit || event.participantLimit;
  const currentCount = event.registeredCount || 0;
  if (limit && currentCount >= limit) {
    return { eligible: false, reason: "Event has reached maximum capacity." };
  }

  // 5. Eligibility rules (if enabled)
  const eligibility = event.eligibility || {};
  const isEligibilityEnabled = eligibility.enabled !== false && (
    (eligibility.years && eligibility.years.length > 0) ||
    (eligibility.branchCodes && eligibility.branchCodes.length > 0) ||
    (event.eligibleDepartments && event.eligibleDepartments.length > 0) ||
    (event.eligibleYears && event.eligibleYears.length > 0)
  );

  if (isEligibilityEnabled) {
    // Academic year check
    const allowedYears = (eligibility.years || event.eligibleYears || []).map(Number);
    if (allowedYears.length > 0) {
      let studentYear = student.currentYear || student.year;
      if (typeof studentYear === "string") {
        studentYear = parseInt(studentYear, 10);
      }
      studentYear = Number(studentYear) || 1;
      if (!allowedYears.includes(studentYear)) {
        return {
          eligible: false,
          reason: `Event is restricted to Year ${allowedYears.join(", ")} students.`,
        };
      }
    }

    // Branch / Department check
    const allowedDepts = (
      eligibility.branchCodes ||
      eligibility.branches ||
      event.eligibleDepartments ||
      []
    ).map((d) => String(d).toUpperCase());

    if (allowedDepts.length > 0 && !allowedDepts.includes("ALL")) {
      const studentDept = String(student.department || student.branch || "").toUpperCase();
      if (studentDept && !allowedDepts.includes(studentDept)) {
        return {
          eligible: false,
          reason: `Event is restricted to ${allowedDepts.join(", ")} department(s).`,
        };
      }
    }
  }

  return { eligible: true, reason: "" };
}

// Register for an event
export function registerStudentForEvent(studentId, eventId) {
  const newReg = {
    registrationId: `REG-${Date.now()}`,
    studentId: studentId,
    eventId: eventId,
    registrationDate: new Date().toISOString(),
    status: "registered",
    qrCode: `QR-${eventId}-${studentId}`,
  };
  return newReg;
}

// Get full registered event details
export function getRegisteredEvents(studentId) {
  return [];
}

// --------------------------------------------
// CERTIFICATES
// --------------------------------------------

export async function fetchMyCertificatesApi() {
  try {
    const res = await certificateService.getMyCertificates();
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch student certificates from API:", err);
    throw err;
  }
}

export async function checkCertificateEligibilityApi(eventId) {
  try {
    const res = await certificateService.checkEligibility(eventId);
    return res;
  } catch (err) {
    console.error("Failed to check certificate eligibility from API:", err);
    throw err;
  }
}

export function getStudentCertificates(studentId) {
  return [];
}

export function getStudentCertificateForEvent(studentId, eventId) {
  return null;
}

// --------------------------------------------
// FEEDBACK
// --------------------------------------------

export async function fetchMyFeedbackApi() {
  try {
    const res = await feedbackService.getMyFeedback();
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch student feedback from API:", err);
    throw err;
  }
}

export async function submitFeedbackApi(feedbackData) {
  try {
    const res = await feedbackService.submitFeedback(feedbackData);
    return res.data;
  } catch (err) {
    console.error("Failed to submit feedback via API:", err);
    throw err;
  }
}

export function getStudentFeedback(studentId) {
  return [];
}

export function hasSubmittedFeedback(studentId, eventId) {
  return false;
}

export function submitStudentFeedback(studentId, eventId, data) {
  return {
    feedbackId: `FB_${studentId}_${eventId}`,
    studentId,
    eventId,
    overallRating: Number(data.overallRating),
    contentRating: Number(data.contentRating),
    speakerRating: Number(data.speakerRating),
    comment: (data.comment || "").trim(),
    wouldRecommend: Boolean(data.wouldRecommend),
    submittedAt: new Date().toISOString(),
    isAnonymous: false,
  };
}

// --------------------------------------------
// ATTENDANCE
// --------------------------------------------

export async function fetchMyAttendanceApi() {
  try {
    const res = await attendanceService.getMyAttendance();
    return res.data || [];
  } catch (err) {
    console.error("Failed to fetch student attendance from API:", err);
    throw err;
  }
}

export function getStudentAttendance(studentId) {
  return [];
}

export function getStudentAttendanceForEvent(studentId, eventId) {
  return null;
}

export function getStudentCompletedEvents(studentId) {
  return [];
}

// --------------------------------------------
// DASHBOARD
// --------------------------------------------

export function getNearestUpcomingEvent() {
  return null;
}

export function getDashboardStats(studentId) {
  return {
    upcomingEvents: 0,
    registeredEvents: 0,
    completedEvents: 0,
    certificates: 0,
  };
}

// --------------------------------------------
// ABOUT TCF
// --------------------------------------------

export function getAboutTCF() {
  return staticAboutTCF;
}

// --------------------------------------------
// LEARNING HUB
// --------------------------------------------

export function getLearningResources() {
  return [];
}

export function getFeaturedLearningResources() {
  return [];
}

export function getLearningResourcesByCategory(category) {
  return [];
}

// --------------------------------------------
// NOTIFICATIONS
// --------------------------------------------

export function getStudentNotifications(studentId) {
  return [];
}

// --------------------------------------------
// PROFILE
// --------------------------------------------

export function getStudentProfile(studentId) {
  const user = getAuthUser();
  if (user && (user.id === studentId || user._id === studentId || user.role === "student")) {
    return {
      ...user,
      id: user.id || user._id,
      fullName: user.fullName || user.name || "Student",
      enrollmentNo: user.enrollmentNo || user.enrollmentNumber || "",
      department: user.department || "IT",
      year: user.year || 3,
      batch: user.batch || `${2025 - (user.year || 3) + 1}-${2029 - (user.year || 3) + 1}`,
    };
  }

  const stored = localStorage.getItem(`axon_profile_${studentId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  return null;
}

export function updateStudentProfile(studentId, updatedData) {
  const current = getStudentProfile(studentId) || {};
  const merged = { ...current, ...updatedData };
  localStorage.setItem(`axon_profile_${studentId}`, JSON.stringify(merged));
  return merged;
}
