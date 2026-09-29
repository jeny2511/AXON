// Student Shared Service
import { attendance as mockAttendance } from "../../mockData/attendance";
import { events as mockEvents } from "../../mockData/events";
import { registrations as mockRegistrations } from "../../mockData/registrations";
import { certificates as mockCertificates } from "../../mockData/certificates";
import { feedback as mockFeedback } from "../../mockData/feedback";
import { gallery as mockGallery } from "../../mockData/gallery";
import { aboutTCF as mockAboutTCF } from "../../mockData/about";
import { notifications as mockNotifications } from "../../mockData/notifications";
import { learning as mockLearning } from "../../mockData/learning";
import { users as mockUsers } from "../../mockData/users";

// Default active student (can be stored in localStorage for demo)
export function getActiveStudentId() {
  return localStorage.getItem("axon_active_student_id") || "ST001";
}

export function setActiveStudentId(studentId) {
  localStorage.setItem("axon_active_student_id", studentId);
}

// --------------------------------------------
// EVENTS
// --------------------------------------------

export function getAllEvents() {
  return mockEvents;
}

export function getGallery() {
  return mockGallery;
}

export function getUpcomingEvents() {
  return mockEvents.filter((event) => event.status === "upcoming");
}

export function getOngoingEvents() {
  return mockEvents.filter((event) => event.status === "ongoing");
}

export function getCompletedEvents() {
  return mockEvents.filter((event) => event.status === "completed");
}

export function getEventById(eventId) {
  return mockEvents.find((event) => event.id === eventId);
}

// --------------------------------------------
// REGISTRATIONS
// --------------------------------------------

// Get stored custom registrations or fallback to mock registrations
function getAllRegistrations() {
  const stored = localStorage.getItem("axon_custom_registrations");
  if (stored) {
    try {
      const custom = JSON.parse(stored);
      return [...mockRegistrations, ...custom];
    } catch {
      return mockRegistrations;
    }
  }
  return mockRegistrations;
}

export function getStudentRegistrations(studentId) {
  const allRegs = getAllRegistrations();
  return allRegs.filter((reg) => reg.studentId === studentId);
}

export function isStudentRegistered(studentId, eventId) {
  const studentRegs = getStudentRegistrations(studentId);
  return studentRegs.some(
    (reg) => reg.eventId === eventId && reg.status === "registered"
  );
}

// Check the 4 mandatory business rules for registration eligibility
export function checkRegistrationEligibility(event, student) {
  if (!event || !student) {
    return { eligible: false, reason: "Invalid event or student data." };
  }

  // 1. Is event open for registration?
  if (event.registrationStatus !== "open") {
    return {
      eligible: false,
      reason:
        event.registrationStatus === "full"
          ? "Event registration is full."
          : "Event registration is closed.",
    };
  }

  // 2. Has registration deadline passed?
  if (event.registrationClose) {
    const closeDate = new Date(event.registrationClose);
    const now = new Date();
    if (now > closeDate) {
      return { eligible: false, reason: "Registration deadline has passed." };
    }
  }

  // 3. Has capacity been reached?
  if (
    event.participantLimit &&
    event.registeredCount &&
    event.registeredCount >= event.participantLimit
  ) {
    return { eligible: false, reason: "Event has reached maximum capacity." };
  }

  // 4. Branch eligibility
  if (
    event.eligibleDepartments &&
    !event.eligibleDepartments.includes("ALL") &&
    !event.eligibleDepartments.includes(student.department)
  ) {
    return {
      eligible: false,
      reason: `Event is restricted to ${event.eligibleDepartments.join(", ")} department(s).`,
    };
  }

  // 5. Academic year eligibility
  if (
    event.eligibleYears &&
    student.year &&
    !event.eligibleYears.includes(student.year)
  ) {
    return {
      eligible: false,
      reason: `Event is restricted to Year ${event.eligibleYears.join(", ")} students.`,
    };
  }

  // 6. Already registered?
  if (isStudentRegistered(student.id, event.id)) {
    return { eligible: false, reason: "You are already registered for this event." };
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

  const stored = localStorage.getItem("axon_custom_registrations");
  let custom = [];
  if (stored) {
    try {
      custom = JSON.parse(stored);
    } catch {
      custom = [];
    }
  }
  custom.push(newReg);
  localStorage.setItem("axon_custom_registrations", JSON.stringify(custom));

  return newReg;
}

// Get full registered event details
export function getRegisteredEvents(studentId) {
  const studentRegistrations = getStudentRegistrations(studentId);

  return studentRegistrations
    .map((registration) => {
      const event = getEventById(registration.eventId);
      if (!event) return null;

      return {
        ...event,
        registrationId: registration.registrationId,
        registrationDate: registration.registrationDate,
        registrationStatus: registration.status,
        qrCode: registration.qrCode,
      };
    })
    .filter(Boolean);
}

// --------------------------------------------
// CERTIFICATES
// --------------------------------------------

export function getStudentCertificates(studentId) {
  return mockCertificates.filter(
    (certificate) => certificate.studentId === studentId
  );
}

export function getStudentCertificateForEvent(studentId, eventId) {
  return mockCertificates.find(
    (cert) => cert.studentId === studentId && cert.eventId === eventId
  );
}

// --------------------------------------------
// FEEDBACK
// --------------------------------------------

export function getStudentFeedback(studentId) {
  return mockFeedback.filter((item) => item.studentId === studentId);
}

export function hasSubmittedFeedback(studentId, eventId) {
  const localSaved = localStorage.getItem(
    `axon_feedback_${studentId}_${eventId}`
  );
  if (localSaved) return true;

  return mockFeedback.some(
    (item) => item.studentId === studentId && item.eventId === eventId
  );
}

export function submitStudentFeedback(studentId, eventId, data) {
  const feedbackData = {
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

  localStorage.setItem(
    `axon_feedback_${studentId}_${eventId}`,
    JSON.stringify(feedbackData)
  );

  return feedbackData;
}

// --------------------------------------------
// ATTENDANCE
// --------------------------------------------

export function getStudentAttendance(studentId) {
  return mockAttendance.filter((item) => item.studentId === studentId);
}

export function getStudentAttendanceForEvent(studentId, eventId) {
  return mockAttendance.find(
    (item) => item.studentId === studentId && item.eventId === eventId
  );
}

// Get events where student attendance is present
export function getStudentCompletedEvents(studentId) {
  const presentAttendance = mockAttendance.filter(
    (item) => item.studentId === studentId && item.status === "present"
  );

  return presentAttendance
    .map((att) => getEventById(att.eventId))
    .filter(Boolean);
}

// --------------------------------------------
// DASHBOARD
// --------------------------------------------

export function getNearestUpcomingEvent() {
  const upcomingEvents = getUpcomingEvents();

  if (upcomingEvents.length === 0) {
    return null;
  }

  return upcomingEvents.reduce((nearest, event) => {
    return new Date(event.eventDate) < new Date(nearest.eventDate)
      ? event
      : nearest;
  });
}

export function getDashboardStats(studentId) {
  const registeredEvents = getStudentRegistrations(studentId).filter(
    (r) => r.status === "registered"
  );
  const completedEvents = getStudentCompletedEvents(studentId);
  const studentCertificates = getStudentCertificates(studentId);

  return {
    upcomingEvents: getUpcomingEvents().length,
    registeredEvents: registeredEvents.length,
    completedEvents: completedEvents.length,
    certificates: studentCertificates.length,
  };
}

// --------------------------------------------
// ABOUT TCF
// --------------------------------------------

export function getAboutTCF() {
  return mockAboutTCF;
}

// --------------------------------------------
// LEARNING HUB
// --------------------------------------------

export function getLearningResources() {
  return mockLearning;
}

export function getFeaturedLearningResources() {
  return mockLearning.filter((resource) => resource.isFeatured === true);
}

export function getLearningResourcesByCategory(category) {
  if (!category || category === "All") return mockLearning;
  return mockLearning.filter((resource) => resource.category === category);
}

// --------------------------------------------
// NOTIFICATIONS
// --------------------------------------------

export function getStudentNotifications(studentId) {
  return mockNotifications.filter(
    (notification) => notification.userId === studentId
  );
}

// --------------------------------------------
// PROFILE
// --------------------------------------------

export function getStudentProfile(studentId) {
  const stored = localStorage.getItem(`axon_profile_${studentId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const user = mockUsers.find(
    (u) => u.id === studentId && u.role === "student"
  );
  if (!user) return null;

  return {
    ...user,
    batch: user.batch || `${2025 - (user.year || 3) + 1}-${2029 - (user.year || 3) + 1}`,
  };
}

export function updateStudentProfile(studentId, updatedData) {
  const current = getStudentProfile(studentId);
  const merged = { ...current, ...updatedData };
  localStorage.setItem(`axon_profile_${studentId}`, JSON.stringify(merged));
  return merged;
}
