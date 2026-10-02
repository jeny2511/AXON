// Student Shared Service
import { attendance as mockAttendance } from "../../mockData/attendance";
import { events as mockEvents } from "../../mockData/events";
import { registrations as mockRegistrations } from "../../mockData/registrations";
import { certificates as mockCertificates } from "../../mockData/certificates";
import { feedback as mockFeedback } from "../../mockData/feedback";
import { feedbackForms } from "../../mockData/feedbackForms";
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

import api from "../../services/api.js";

// Cache key for live events fetched from backend
const EVENTS_CACHE_KEY = "axon_live_events";

// Helper to normalize backend event format to match all frontend requirements
export function normalizeEvent(e) {
  if (!e) return null;
  const id = e._id ? String(e._id) : (e.id || `EV_${Date.now()}`);

  let eventDate = "";
  if (e.date) {
    try {
      eventDate = new Date(e.date).toISOString().split("T")[0];
    } catch {
      eventDate = e.date;
    }
  } else {
    eventDate = e.eventDate || "";
  }

  let eventEndDate = "";
  if (e.endDate) {
    try {
      eventEndDate = new Date(e.endDate).toISOString().split("T")[0];
    } catch {
      eventEndDate = e.endDate;
    }
  } else {
    eventEndDate = e.eventEndDate || eventDate;
  }

  // Derive status compatible with student frontend ("upcoming", "ongoing", "completed")
  let status = "upcoming";
  const now = new Date();
  const eventStart = e.date ? new Date(e.date) : (e.eventDate ? new Date(e.eventDate) : null);
  const eventEnd = e.endDate ? new Date(e.endDate) : eventStart;

  if (e.status === "completed" || e.status === "past") {
    status = "completed";
  } else if (e.status === "ongoing") {
    status = "ongoing";
  } else if (eventStart && eventEnd) {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    if (eventStart <= todayEnd && eventEnd >= todayStart) {
      status = "ongoing";
    } else if (eventEnd < todayStart) {
      status = "completed";
    } else {
      status = "upcoming";
    }
  }

  // Derive registrationStatus ("open", "closed", "full")
  let registrationStatus = "open";
  const capacity = e.participantsLimit || e.participantLimit || 100;
  const count = e.registeredCount || 0;
  const seatsLeft = e.seatsLeft !== undefined ? e.seatsLeft : Math.max(0, capacity - count);

  if (
    e.isRegistrationOpen === false ||
    e.status === "registration_closed" ||
    (e.registration?.closeAt && now > new Date(e.registration.closeAt))
  ) {
    registrationStatus = "closed";
  }
  if (seatsLeft <= 0 || (capacity && count >= capacity)) {
    registrationStatus = "full";
  }

  // Rulebook URL resolution
  const rulebook = (e.rulebooks && e.rulebooks[0]?.url) || e.rulebook || "";

  // Department & Year eligibility
  const eligibleDepartments =
    e.eligibility?.branchCodes || e.eligibleDepartments || ["ALL"];
  const eligibleYears =
    e.eligibility?.academicYears || e.eligibleYears || [1, 2, 3, 4];

  return {
    ...e,
    id,
    _id: id,
    name: e.name || e.title || "Event",
    title: e.name || e.title || "Event",
    category: e.category || "General",
    status,
    rawStatus: e.status,
    registrationStatus,
    description: e.description || "",
    venue: e.venue || "",
    eventDate,
    date: eventDate,
    eventEndDate,
    endDate: eventEndDate,
    startTime: e.startTime || "10:00",
    endTime: e.endTime || "17:00",
    eventTime: `${e.startTime || "10:00"} - ${e.endTime || "17:00"}`,
    poster: (() => {
      const p = e.poster || "";
      if (p && !p.startsWith("/assets/images/events/")) {
        return p;
      }
      const nameKey = (e.name || e.title || "").toLowerCase();
      if (nameKey.includes("hackathon") || nameKey.includes("sih")) {
        return "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80";
      }
      if (nameKey.includes("ctf") || nameKey.includes("flag")) {
        return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80";
      }
      if (nameKey.includes("bounty") || nameKey.includes("defense")) {
        return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80";
      }
      if (nameKey.includes("linux") || nameKey.includes("kali")) {
        return "https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1200&q=80";
      }
      if (nameKey.includes("phishing") || nameKey.includes("awareness")) {
        return "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80";
      }
      return "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80";
    })(),
    speakerName: e.speaker || e.speakerName || "TCF Team",
    speaker: e.speaker || e.speakerName || "TCF Team",
    registrationOpen: e.registration?.openAt || e.registrationOpen || "",
    registrationClose: e.registration?.closeAt || e.registrationClose || "",
    attendanceOpen: e.attendance?.openAt || e.attendanceOpen || "",
    attendanceClose: e.attendance?.closeAt || e.attendanceClose || "",
    participantLimit: capacity,
    participantsLimit: capacity,
    registeredCount: count,
    seatsLeft,
    eligibleDepartments,
    eligibleYears,
    rulebook,
    rulebooks: e.rulebooks || (rulebook ? [{ name: "Rulebook", url: rulebook, type: "pdf" }] : []),
    certificateAvailable: Boolean(e.certificateAvailable),
    feedbackRequired: Boolean(e.feedbackRequired),
  };
}

// Load cached live events or fallback to mock events
function loadStoredEvents() {
  const cached = localStorage.getItem(EVENTS_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeEvent);
      }
    } catch {
      // Fallback
    }
  }
  return mockEvents.map(normalizeEvent);
}

let currentEvents = loadStoredEvents();

// Fetch live events from Express backend (/api/events)
export async function fetchEvents() {
  try {
    const res = await api.get("/events");
    if (res && res.success && Array.isArray(res.events)) {
      const normalized = res.events.map(normalizeEvent);
      currentEvents = normalized;
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event("axon-events-change"));
      return normalized;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] Live /api/events fetch failed, using cached/mock data:", err.message);
  }
  return currentEvents;
}

// Auto-trigger background fetch once on initialization
if (typeof window !== "undefined") {
  setTimeout(() => {
    fetchEvents().catch(() => {});
    fetchGallery().catch(() => {});
    fetchStudentFeedbackSubmissions().catch(() => {});
    fetchStudentNotifications().catch(() => {});
    fetchStudentProfile().catch(() => {});
  }, 100);
}

// --------------------------------------------
// EVENTS
// --------------------------------------------

export function getAllEvents() {
  return currentEvents;
}

// --------------------------------------------
// GALLERY
// --------------------------------------------
const GALLERY_CACHE_KEY = "axon_live_gallery";

export function normalizeGalleryAlbum(g) {
  if (!g) return null;
  const id = g._id ? String(g._id) : (g.galleryId || g.id || `GAL_${Date.now()}`);
  const photos = Array.isArray(g.photos) ? g.photos : [];
  const coverImage = g.coverImage || g.banner || (photos.length > 0 ? photos[0] : "");
  const eventDate = g.eventDate || g.date || "";
  const category =
    g.category ||
    (Array.isArray(g.tags) && g.tags.length > 0 ? g.tags[0] : "Campus Event");

  return {
    ...g,
    _id: id,
    id,
    galleryId: id,
    eventName: g.eventName || "Campus Event",
    venue: g.venue || "VGEC Campus",
    eventDate,
    date: eventDate,
    eventTime: g.time || g.eventTime || "10:00 - 16:00",
    time: g.time || g.eventTime || "10:00 - 16:00",
    description: g.description || "",
    coverImage,
    banner: coverImage,
    photos,
    totalPhotos: photos.length || g.totalPhotos || 0,
    tags: Array.isArray(g.tags) ? g.tags : [],
    category,
    speakerName:
      g.speakerName ||
      (g.createdBy?.fullName ? g.createdBy.fullName : "TCF Team"),
  };
}

export function getGallery() {
  const cached = localStorage.getItem(GALLERY_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeGalleryAlbum);
      }
    } catch {}
  }
  return mockGallery.map(normalizeGalleryAlbum);
}

export async function fetchGallery() {
  try {
    const res = await api.get("/gallery");
    if (res && res.success && Array.isArray(res.albums)) {
      const normalized = res.albums.map(normalizeGalleryAlbum);
      localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event("axon-gallery-change"));
      return normalized;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchGallery failed, using fallback:", err.message);
  }
  return getGallery();
}

export function getUpcomingEvents() {
  return currentEvents.filter((event) => event.status === "upcoming");
}

export function getOngoingEvents() {
  return currentEvents.filter((event) => event.status === "ongoing");
}

export function getCompletedEvents() {
  return currentEvents.filter((event) => event.status === "completed");
}

export function getEventById(eventId) {
  if (!eventId) return null;
  return currentEvents.find(
    (event) =>
      event.id === eventId ||
      event._id === eventId ||
      String(event.id) === String(eventId) ||
      String(event._id) === String(eventId)
  );
}

// --------------------------------------------
// REGISTRATIONS
// --------------------------------------------

// Fetch live registrations from backend for current student
export async function fetchStudentRegistrations(studentId) {
  try {
    const res = await api.get("/registrations/my-events");
    if (res && res.success && Array.isArray(res.registrations)) {
      const activeUser = getActiveStudentUser();
      const currentId = studentId || activeUser?.id || activeUser?._id;
      const normalizedRegs = res.registrations.map((r) => {
        const evId = r.event?._id ? String(r.event._id) : (r.eventId?._id ? String(r.eventId._id) : String(r.eventId || ""));
        return {
          registrationId: r._id ? String(r._id) : (r.registrationId || r.id),
          id: r._id ? String(r._id) : (r.registrationId || r.id),
          studentId: currentId,
          eventId: evId,
          registrationDate: r.registeredAt || r.registrationDate || new Date().toISOString(),
          status: r.status || "registered",
          qrCode: r.qrCode || `QR-${evId}-${currentId}`,
          event: r.event ? normalizeEvent(r.event) : null,
        };
      });

      localStorage.setItem("axon_live_registrations", JSON.stringify(normalizedRegs));
      window.dispatchEvent(new Event("axon-registrations-change"));
      return normalizedRegs;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchStudentRegistrations failed, using fallback:", err.message);
  }
  return getAllRegistrations();
}

// Get stored custom registrations or fallback to mock registrations
function getAllRegistrations() {
  const live = localStorage.getItem("axon_live_registrations");
  if (live) {
    try {
      const parsed = JSON.parse(live);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
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
    (reg) =>
      (reg.eventId === eventId ||
        reg.eventId === String(eventId) ||
        reg.event?._id === eventId ||
        reg.event?.id === eventId) &&
      reg.status === "registered"
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

// Register for an event (synchronous signature with background API dispatch)
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

  // If online & eventId exists, sync with backend asynchronously
  if (eventId) {
    api.post(`/registrations/${eventId}`)
      .then((res) => {
        if (res && res.success && res.registration) {
          fetchStudentRegistrations(studentId).catch(() => {});
        }
      })
      .catch((err) => {
        console.warn("⚠️ Live registration call failed or offline fallback used:", err.message);
      });
  }

  window.dispatchEvent(new Event("axon-registrations-change"));
  return newReg;
}

// Explicit async registration for caller awaiting live response
export async function registerStudentForEventAsync(studentId, eventId) {
  try {
    const res = await api.post(`/registrations/${eventId}`);
    if (res && res.success && res.registration) {
      await fetchStudentRegistrations(studentId);
      return res;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] Live registerStudentForEventAsync failed:", err.message);
    throw err;
  }
}

// Get full registered event details
export function getRegisteredEvents(studentId) {
  const studentRegistrations = getStudentRegistrations(studentId);

  return studentRegistrations
    .map((registration) => {
      const event = registration.event || getEventById(registration.eventId);
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

export function normalizeCertificate(c) {
  if (!c) return null;
  const certId = c.certificateId || c.id || c._id || `CERT_${Date.now()}`;
  const evId = c.event?.id || c.event?._id || c.eventId?._id || c.eventId || "";
  const issueDate = c.issuedAt ? new Date(c.issuedAt).toISOString().split("T")[0] : (c.issueDate || "");
  const certUrl = c.pdfUrl || c.certificateUrl || "/assets/certificates/default.pdf";
  return {
    ...c,
    certificateId: certId,
    id: certId,
    _id: certId,
    studentId: c.studentId?._id ? String(c.studentId._id) : (c.studentId || ""),
    eventId: evId,
    certificateTitle:
      c.certificateTitle ||
      (c.event?.name ? `${c.event.name} - Certificate` : "Participation Certificate"),
    issueDate,
    certificateUrl: certUrl,
    pdfUrl: certUrl,
    verificationCode: c.verificationCode || certId,
    status: c.isLocked ? "locked" : (c.status || "available"),
    event: c.event ? normalizeEvent(c.event) : null,
  };
}

function getAllCertificates() {
  const live = localStorage.getItem("axon_live_certificates");
  if (live) {
    try {
      const parsed = JSON.parse(live);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  return mockCertificates.map(normalizeCertificate);
}

export async function fetchStudentCertificates(studentId) {
  try {
    const res = await api.get("/certificates/my-certificates");
    if (res && res.success && Array.isArray(res.certificates)) {
      const normalizedCerts = res.certificates.map(normalizeCertificate);
      localStorage.setItem("axon_live_certificates", JSON.stringify(normalizedCerts));
      window.dispatchEvent(new Event("axon-certificates-change"));
      return normalizedCerts;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchStudentCertificates failed, using fallback:", err.message);
  }
  return getAllCertificates();
}

export function getStudentCertificates(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  const allCerts = getAllCertificates();
  return allCerts.filter(
    (certificate) =>
      certificate.studentId === resolvedId ||
      certificate.studentId === studentId ||
      (rawId && certificate.studentId === rawId) ||
      !certificate.studentId
  );
}

export function getStudentCertificateForEvent(studentId, eventId) {
  const allCerts = getStudentCertificates(studentId);
  const evIdStr = String(eventId || "");

  return allCerts.find(
    (cert) =>
      cert.eventId === eventId ||
      String(cert.eventId) === evIdStr ||
      cert.event?.id === eventId ||
      cert.event?._id === eventId ||
      String(cert.event?.id) === evIdStr ||
      String(cert.event?._id) === evIdStr
  );
}

// --------------------------------------------
// FEEDBACK
// --------------------------------------------
const FEEDBACK_SUBMISSIONS_KEY = "axon_live_feedbacks";

function loadStoredFeedbackSubmissions() {
  const cached = localStorage.getItem(FEEDBACK_SUBMISSIONS_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

export async function fetchStudentFeedbackSubmissions() {
  try {
    const res = await api.get("/feedback/my-feedback");
    if (res && res.success && Array.isArray(res.feedbacks)) {
      localStorage.setItem(FEEDBACK_SUBMISSIONS_KEY, JSON.stringify(res.feedbacks));
      window.dispatchEvent(new Event("axon-feedback-change"));
      return res.feedbacks;
    }
  } catch (err) {
    // Non-blocking
  }
  return loadStoredFeedbackSubmissions();
}

export function getStudentFeedback(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  const live = loadStoredFeedbackSubmissions();
  if (live.length > 0) {
    return live;
  }

  return mockFeedback.filter(
    (item) =>
      item.studentId === resolvedId ||
      item.studentId === studentId ||
      (rawId && item.studentId === rawId)
  );
}

export function hasSubmittedFeedback(studentId, eventId) {
  const resolvedId = resolveStudentId(studentId);
  const evId = String(eventId?._id || eventId || "");
  const localSaved =
    localStorage.getItem(`axon_feedback_${studentId}_${evId}`) ||
    localStorage.getItem(`axon_feedback_${resolvedId}_${evId}`);
  if (localSaved) return true;

  const live = loadStoredFeedbackSubmissions();
  if (live.some((f) => String(f.eventId?._id || f.eventId) === evId)) {
    return true;
  }

  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockFeedback.some(
    (item) =>
      (item.studentId === resolvedId ||
        item.studentId === studentId ||
        (rawId && item.studentId === rawId)) &&
      (String(item.eventId) === evId || String(item.eventId?._id) === evId)
  );
}

export async function fetchEventFeedbackForm(eventId) {
  const evId = String(eventId?._id || eventId || "");
  try {
    const res = await api.get(`/feedback/form/${evId}`);
    if (res && res.success && res.form) {
      const backendQuestions = Array.isArray(res.form.questions) ? res.form.questions : [];
      const normalizedQuestions = backendQuestions.map((q, idx) => {
        const qId = q._id ? String(q._id) : (q.id || `q_${idx}`);
        let type = q.type || "rating";
        let options = q.options;
        if (type === "boolean") {
          type = "radio";
          options = ["Yes", "No"];
        }
        return {
          id: qId,
          _id: qId,
          question: q.question,
          type,
          scale: q.scale || 5,
          required: q.required !== false,
          options,
        };
      });

      return {
        ...res.form,
        questions: normalizedQuestions,
        hasAttended: res.hasAttended,
        hasSubmitted: res.hasSubmitted,
        canSubmit: res.canSubmit,
      };
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchEventFeedbackForm failed, using fallback:", err.message);
  }
  return getEventFeedbackForm(evId);
}

export function getEventFeedbackForm(eventId) {
  const evId = String(eventId?._id || eventId || "");
  // 1. Check custom forms stored in localStorage from Volunteer module
  try {
    const saved = localStorage.getItem("axon_feedback_forms");
    if (saved) {
      const parsed = JSON.parse(saved);
      const match = parsed.find(
        (f) =>
          String(f.eventId).toLowerCase() === evId.toLowerCase()
      );
      if (match && match.questions && match.questions.length > 0) {
        return match;
      }
    }
  } catch (e) {
    console.error("Error loading forms from localStorage:", e);
  }

  // 2. Fallback to mockData feedbackForms
  const mockMatch = feedbackForms.find(
    (f) =>
      String(f.eventId).toLowerCase() === evId.toLowerCase()
  );
  if (mockMatch && mockMatch.questions && mockMatch.questions.length > 0) {
    return mockMatch;
  }

  return null;
}

export async function submitStudentFeedback(studentId, eventId, answers) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const evId = String(eventId?._id || eventId || "");
  const student = getStudentProfile(studentId) || {
    fullName: activeUser?.name || "Student",
    enrollmentNo: "220130107054",
    department: "IT",
    year: 3,
  };

  // Convert answers to backend payload format
  let payload = {};
  if (answers && typeof answers === "object") {
    if ("overallRating" in answers) {
      payload = {
        overallRating: Number(answers.overallRating) || 5,
        speakerRating: Number(answers.speakerRating) || Number(answers.overallRating) || 5,
        contentRating: Number(answers.contentRating) || Number(answers.overallRating) || 5,
        organizationRating: Number(answers.organizationRating) || Number(answers.overallRating) || 5,
        wouldRecommend: answers.wouldRecommend !== undefined ? Boolean(answers.wouldRecommend) : true,
        comment: answers.comment || "",
        isAnonymous: Boolean(answers.isAnonymous),
      };
    } else {
      let overall = 5;
      let speaker = 5;
      let org = 5;
      let content = 5;
      let recommend = true;
      const textParts = [];

      Object.entries(answers).forEach(([k, val]) => {
        if (typeof val === "number" || (!isNaN(val) && val !== "" && typeof val === "string" && !isNaN(Number(val)))) {
          const num = Number(val);
          if (num >= 1 && num <= 5) {
            overall = num;
            speaker = num;
            org = num;
            content = num;
          }
        } else if (typeof val === "string") {
          const lower = val.toLowerCase();
          if (lower === "yes" || lower === "true") {
            recommend = true;
          } else if (lower === "no" || lower === "false") {
            recommend = false;
          } else {
            textParts.push(val);
          }
        } else if (typeof val === "boolean") {
          recommend = val;
        } else if (Array.isArray(val)) {
          textParts.push(val.join(", "));
        }
      });

      payload = {
        overallRating: overall,
        speakerRating: speaker,
        organizationRating: org,
        contentRating: content,
        wouldRecommend: recommend,
        comment: textParts.join(" | "),
        isAnonymous: false,
      };
    }
  }

  const feedbackData = {
    feedbackId: `FB_${resolvedId}_${evId}`,
    studentId: resolvedId,
    eventId: evId,
    answers,
    ...payload,
    submittedAt: new Date().toISOString(),
  };

  // Try live Express backend first
  try {
    const res = await api.post(`/feedback/submit/${evId}`, payload);
    if (res && res.success) {
      localStorage.setItem(`axon_feedback_${studentId}_${evId}`, JSON.stringify(res.feedback || feedbackData));
      localStorage.setItem(`axon_feedback_${resolvedId}_${evId}`, JSON.stringify(res.feedback || feedbackData));

      // Refresh feedback submissions and certificates
      await fetchStudentFeedbackSubmissions().catch(() => {});
      if (res.certificateUnlocked) {
        await fetchStudentCertificates(studentId).catch(() => {});
      }

      window.dispatchEvent(new Event("axon-feedback-change"));
      window.dispatchEvent(new Event("axon-certificates-change"));
      return res.feedback || feedbackData;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] Live submitFeedback failed, saving locally:", err.message);
  }

  // Local fallback
  localStorage.setItem(
    `axon_feedback_${studentId}_${evId}`,
    JSON.stringify(feedbackData)
  );
  localStorage.setItem(
    `axon_feedback_${resolvedId}_${evId}`,
    JSON.stringify(feedbackData)
  );

  // Sync to volunteer feedback responses in localStorage
  try {
    const savedForms = localStorage.getItem("axon_feedback_forms");
    const formsList = savedForms ? JSON.parse(savedForms) : [...feedbackForms];
    const formIndex = formsList.findIndex(
      (f) => String(f.eventId).toLowerCase() === evId.toLowerCase()
    );

    const newResponse = {
      id: `RESP_${Date.now()}`,
      name: student.fullName,
      enrollment: student.enrollmentNo || "220130107054",
      branch: student.department || "IT",
      yearSem: student.year ? `${student.year}rd Year` : "3rd Year",
      answers,
    };

    if (formIndex >= 0) {
      if (!formsList[formIndex].responses) {
        formsList[formIndex].responses = [];
      }
      const existingIdx = formsList[formIndex].responses.findIndex(
        (r) => r.enrollment === newResponse.enrollment
      );
      if (existingIdx >= 0) {
        formsList[formIndex].responses[existingIdx] = newResponse;
      } else {
        formsList[formIndex].responses.push(newResponse);
      }
    }
    localStorage.setItem("axon_feedback_forms", JSON.stringify(formsList));
  } catch (e) {
    console.error("Error updating volunteer feedback responses:", e);
  }

  window.dispatchEvent(new Event("axon-feedback-change"));
  return feedbackData;
}

// --------------------------------------------
// ATTENDANCE
// --------------------------------------------

function getAllAttendance() {
  const live = localStorage.getItem("axon_live_attendance");
  if (live) {
    try {
      const parsed = JSON.parse(live);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {}
  }
  return mockAttendance;
}

export async function fetchStudentAttendance(studentId) {
  try {
    const res = await api.get("/attendance/my-presence");
    if (res && res.success && Array.isArray(res.attendances)) {
      const activeUser = getActiveStudentUser();
      const currentId = studentId || activeUser?.id || activeUser?._id;
      const normalizedAtt = res.attendances.map((a) => {
        const evId = a.eventId ? String(a.eventId) : "";
        return {
          id: a.id || a._id,
          _id: a.id || a._id,
          studentId: currentId,
          eventId: evId,
          eventName: a.eventName,
          status: a.status || "present",
          attendanceDate: a.date ? new Date(a.date).toISOString().split("T")[0] : "",
          method: a.method || "qr_scan",
          event: a.event ? normalizeEvent(a.event) : null,
        };
      });

      localStorage.setItem("axon_live_attendance", JSON.stringify(normalizedAtt));
      window.dispatchEvent(new Event("axon-attendance-change"));
      return normalizedAtt;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchStudentAttendance failed, using fallback:", err.message);
  }
  return getAllAttendance();
}

export function getStudentAttendance(studentId) {
  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  const allAtt = getAllAttendance();
  return allAtt.filter(
    (item) =>
      item.studentId === resolvedId ||
      item.studentId === studentId ||
      (rawId && item.studentId === rawId) ||
      !item.studentId
  );
}

export function getStudentAttendanceForEvent(studentId, eventId) {
  const allAtt = getStudentAttendance(studentId);
  const evIdStr = String(eventId || "");

  return allAtt.find(
    (item) =>
      item.eventId === eventId ||
      String(item.eventId) === evIdStr ||
      item.event?.id === eventId ||
      item.event?._id === eventId ||
      String(item.event?.id) === evIdStr ||
      String(item.event?._id) === evIdStr
  );
}

// Get events where student attendance is present
export function getStudentCompletedEvents(studentId) {
  const allAtt = getStudentAttendance(studentId);
  const presentAttendance = allAtt.filter((item) => item.status === "present");

  return presentAttendance
    .map((att) => att.event || getEventById(att.eventId))
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
const NOTIFICATIONS_CACHE_KEY = "axon_live_notifications";

export function normalizeNotification(n) {
  if (!n) return null;
  const id = n._id ? String(n._id) : (n.notificationId || n.id || `NOTIF_${Date.now()}`);
  return {
    ...n,
    _id: id,
    id,
    notificationId: id,
    userId: n.recipientId ? String(n.recipientId) : (n.userId || ""),
    title: n.title || "Notification",
    message: n.message || "",
    type: n.type || "general",
    isRead: Boolean(n.read !== undefined ? n.read : n.isRead),
    read: Boolean(n.read !== undefined ? n.read : n.isRead),
    createdAt: n.createdAt || new Date().toISOString(),
  };
}

export function getStudentNotifications(studentId) {
  const cached = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeNotification);
      }
    } catch {}
  }

  const resolvedId = resolveStudentId(studentId);
  const activeUser = getActiveStudentUser();
  const rawId = studentId || activeUser?.id || activeUser?._id;

  return mockNotifications
    .filter(
      (notification) =>
        notification.userId === resolvedId ||
        notification.userId === studentId ||
        (rawId && notification.userId === rawId)
    )
    .map(normalizeNotification);
}

export async function fetchStudentNotifications() {
  try {
    const res = await api.get("/notifications");
    if (res && res.success && Array.isArray(res.notifications)) {
      const normalized = res.notifications.map(normalizeNotification);
      localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(normalized));
      window.dispatchEvent(new Event("axon-notifications-change"));
      return normalized;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchStudentNotifications failed, using fallback:", err.message);
  }
  return getStudentNotifications();
}

export async function markNotificationRead(notificationId) {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (err) {
    console.warn("⚠️ [studentService] Live markNotificationRead failed, falling back locally:", err.message);
  }

  // Update local cache
  const cached = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached).map((n) =>
        (n.notificationId === notificationId || n._id === notificationId || n.id === notificationId)
          ? { ...n, isRead: true, read: true }
          : n
      );
      localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }
  window.dispatchEvent(new Event("axon-notifications-change"));
}

export async function markAllNotificationsRead() {
  try {
    await api.patch("/notifications/mark-all-read");
  } catch (err) {
    console.warn("⚠️ [studentService] Live markAllNotificationsRead failed, falling back locally:", err.message);
  }

  // Update local cache
  const cached = localStorage.getItem(NOTIFICATIONS_CACHE_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached).map((n) => ({ ...n, isRead: true, read: true }));
      localStorage.setItem(NOTIFICATIONS_CACHE_KEY, JSON.stringify(list));
    } catch {}
  }
  window.dispatchEvent(new Event("axon-notifications-change"));
}

// --------------------------------------------
// PROFILE
// --------------------------------------------

export async function fetchStudentProfile() {
  try {
    const res = await api.get("/users/profile");
    if (res && res.success && res.user) {
      const u = res.user;
      localStorage.setItem("axon_auth_user", JSON.stringify(u));
      const resolvedId = resolveStudentId(u.id || u._id);
      localStorage.setItem(`axon_profile_${resolvedId}`, JSON.stringify(u));
      window.dispatchEvent(new Event("axon-profile-change"));
      return u;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] fetchStudentProfile failed, using fallback:", err.message);
  }
  return getStudentProfile();
}

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

export async function updateStudentProfile(studentId, updatedData) {
  const current = getStudentProfile(studentId);
  const merged = { ...current, ...updatedData };
  const resolvedId = resolveStudentId(studentId);

  // Try live Express backend
  try {
    const payload = {
      fullName: updatedData.fullName,
      phone: updatedData.phone || updatedData.phoneNumber,
      phoneNumber: updatedData.phone || updatedData.phoneNumber,
      department: updatedData.department,
    };
    const res = await api.put("/users/profile", payload);
    if (res && res.success && res.user) {
      const liveUser = { ...merged, ...res.user };
      localStorage.setItem("axon_auth_user", JSON.stringify(liveUser));
      localStorage.setItem(`axon_profile_${studentId}`, JSON.stringify(liveUser));
      if (resolvedId && resolvedId !== studentId) {
        localStorage.setItem(`axon_profile_${resolvedId}`, JSON.stringify(liveUser));
      }
      window.dispatchEvent(new Event("axon-profile-change"));
      return liveUser;
    }
  } catch (err) {
    console.warn("⚠️ [studentService] Live updateStudentProfile failed, saving locally:", err.message);
  }

  // Local fallback
  localStorage.setItem(`axon_profile_${studentId}`, JSON.stringify(merged));
  if (resolvedId && resolvedId !== studentId) {
    localStorage.setItem(`axon_profile_${resolvedId}`, JSON.stringify(merged));
  }
  window.dispatchEvent(new Event("axon-profile-change"));
  return merged;
}

export async function changeStudentPassword(currentPassword, newPassword) {
  return await api.put("/users/change-password", {
    currentPassword,
    newPassword,
  });
}
