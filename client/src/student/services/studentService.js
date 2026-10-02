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

// Active student session helper (returns null for Guest Mode)
export function getActiveStudentId() {
  return localStorage.getItem("axon_auth_student_id") || null;
}

export function setActiveStudentId(studentId) {
  if (studentId) {
    localStorage.setItem("axon_auth_student_id", studentId);
  } else {
    localStorage.removeItem("axon_auth_student_id");
  }
}

// Get the authenticated user object from localStorage
export function getActiveStudentUser() {
  const stored = localStorage.getItem("axon_auth_user");
  if (stored) {
    try {
      const u = JSON.parse(stored);
      if (u) return u;
    } catch {
      // Fallback
    }
  }
  return null;
}

// Maps MongoDB _id, enrollment number, or ST00x IDs interchangeably
export function resolveStudentId(studentId) {
  if (!studentId) {
    const user = getActiveStudentUser();
    studentId = user?.id || user?._id || localStorage.getItem("axon_auth_student_id");
  }
  if (!studentId) return "ST001";

  if (typeof studentId === "string" && studentId.startsWith("ST")) {
    return studentId;
  }

  const user = getActiveStudentUser();
  const enrollment = user?.enrollmentNumber || user?.enrollmentNo || (typeof studentId === "string" && /^\d+$/.test(studentId) ? studentId : null);
  const email = user?.email;

  const matched = mockUsers.find(
    (u) =>
      u.id === studentId ||
      (enrollment && u.enrollmentNo === enrollment) ||
      (email && u.email?.toLowerCase() === email.toLowerCase())
  );

  return matched ? matched.id : studentId;
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
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;
  const enrollment = activeUser?.enrollmentNumber || activeUser?.enrollmentNo;

  const allRegs = getAllRegistrations();
  return allRegs.filter((reg) => {
    return (
      reg.studentId === resolvedId ||
      reg.studentId === studentId ||
      (rawId && reg.studentId === rawId) ||
      (enrollment && reg.studentId === enrollment)
    );
  });
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
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockCertificates.filter(
    (certificate) =>
      certificate.studentId === resolvedId ||
      certificate.studentId === studentId ||
      (rawId && certificate.studentId === rawId)
  );
}

export function getStudentCertificateForEvent(studentId, eventId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockCertificates.find(
    (cert) =>
      (cert.studentId === resolvedId ||
        cert.studentId === studentId ||
        (rawId && cert.studentId === rawId)) &&
      cert.eventId === eventId
  );
}

// --------------------------------------------
// FEEDBACK
// --------------------------------------------

export function getStudentFeedback(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockFeedback.filter(
    (item) =>
      item.studentId === resolvedId ||
      item.studentId === studentId ||
      (rawId && item.studentId === rawId)
  );
}

export function hasSubmittedFeedback(studentId, eventId) {
  const resolvedId = resolveStudentId(studentId);
  const localSaved =
    localStorage.getItem(`axon_feedback_${studentId}_${eventId}`) ||
    localStorage.getItem(`axon_feedback_${resolvedId}_${eventId}`);
  if (localSaved) return true;

  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockFeedback.some(
    (item) =>
      (item.studentId === resolvedId ||
        item.studentId === studentId ||
        (rawId && item.studentId === rawId)) &&
      item.eventId === eventId
  );
}

export function submitStudentFeedback(studentId, eventId, data) {
  const resolvedId = resolveStudentId(studentId);
  const feedbackData = {
    feedbackId: `FB_${resolvedId}_${eventId}`,
    studentId: resolvedId,
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
  localStorage.setItem(
    `axon_feedback_${resolvedId}_${eventId}`,
    JSON.stringify(feedbackData)
  );

  return feedbackData;
}

// --------------------------------------------
// ATTENDANCE
// --------------------------------------------

export function getStudentAttendance(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockAttendance.filter(
    (item) =>
      item.studentId === resolvedId ||
      item.studentId === studentId ||
      (rawId && item.studentId === rawId)
  );
}

export function getStudentAttendanceForEvent(studentId, eventId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockAttendance.find(
    (item) =>
      (item.studentId === resolvedId ||
        item.studentId === studentId ||
        (rawId && item.studentId === rawId)) &&
      item.eventId === eventId
  );
}

// Get events where student attendance is present
export function getStudentCompletedEvents(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  const presentAttendance = mockAttendance.filter(
    (item) =>
      (item.studentId === resolvedId ||
        item.studentId === studentId ||
        (rawId && item.studentId === rawId)) &&
      item.status === "present"
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
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockNotifications.filter(
    (notification) =>
      notification.userId === resolvedId ||
      notification.userId === studentId ||
      (rawId && notification.userId === rawId)
  );
}

// --------------------------------------------
// PROFILE
// --------------------------------------------

export function getStudentProfile(studentId) {
  const activeUser = getActiveStudentUser();
  const resolvedId = resolveStudentId(studentId);

  const stored =
    localStorage.getItem(`axon_profile_${resolvedId}`) ||
    (activeUser?.id ? localStorage.getItem(`axon_profile_${activeUser.id}`) : null) ||
    (studentId ? localStorage.getItem(`axon_profile_${studentId}`) : null);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }

  const mockUser = mockUsers.find(
    (u) =>
      u.id === resolvedId ||
      u.id === studentId ||
      u.enrollmentNo === resolvedId ||
      (activeUser?.enrollmentNumber && u.enrollmentNo === activeUser.enrollmentNumber)
  );

  if (activeUser && (activeUser.role === "student" || !activeUser.role)) {
    return {
      id: resolvedId || activeUser.id || activeUser._id,
      fullName: activeUser.fullName || mockUser?.fullName || "Student",
      enrollmentNo:
        activeUser.enrollmentNumber ||
        activeUser.enrollmentNo ||
        mockUser?.enrollmentNo ||
        "220130107054",
      email: activeUser.email || mockUser?.email || "student@vgec.ac.in",
      phone:
        activeUser.phoneNumber ||
        activeUser.phone ||
        mockUser?.phone ||
        "9876543210",
      department: activeUser.department || mockUser?.department || "IT",
      year:
        activeUser.academicDetails?.currentYear ||
        activeUser.year ||
        mockUser?.year ||
        3,
      semester:
        activeUser.academicDetails?.currentSemester ||
        activeUser.semester ||
        mockUser?.semester ||
        5,
      batch: activeUser.academicDetails?.batch
        ? `${activeUser.academicDetails.batch.startYear}-${activeUser.academicDetails.batch.endYear}`
        : (typeof activeUser.batch === "object"
            ? `${activeUser.batch.startYear}-${activeUser.batch.endYear}`
            : activeUser.batch) ||
          mockUser?.batch ||
          "2024-2028",
      profilePhoto:
        activeUser.profilePhoto ||
        mockUser?.profilePhoto ||
        "/assets/images/profile/default.jpg",
      role: "student",
      isActive: true,
    };
  }

  if (mockUser) {
    return {
      ...mockUser,
      batch:
        mockUser.batch ||
        `${2025 - (mockUser.year || 3) + 1}-${2029 - (mockUser.year || 3) + 1}`,
    };
  }

  return null;
}

export function updateStudentProfile(studentId, updatedData) {
  const current = getStudentProfile(studentId);
  const merged = { ...current, ...updatedData };
  const resolvedId = resolveStudentId(studentId);

  localStorage.setItem(`axon_profile_${studentId}`, JSON.stringify(merged));
  if (resolvedId && resolvedId !== studentId) {
    localStorage.setItem(`axon_profile_${resolvedId}`, JSON.stringify(merged));
  }
  return merged;
}
