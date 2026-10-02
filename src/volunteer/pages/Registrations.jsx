import { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  QrCode,
  Eye,
  Users,
  UserCheck,
  UserX,
  Download,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  User,
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Camera,
  Check,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Zap,
  RotateCw,
  ArrowLeft,
  History,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  events as mockEvents,
  users as mockUsers,
  registrations as mockRegistrations,
  attendance as mockAttendance,
} from "../../mockData";

// ============================================================================
// SERVICE LAYER (MVC ARCHITECTURE: FRONTEND SERVICE / API SIMULATOR)
// In a full-stack MERN application, these functions make real REST API calls:
// - getEvents():            GET  /api/events
// - getEventParticipants(): GET  /api/events/:id/registrations
// - updateAttendance():     POST /api/events/:id/attendance
// ============================================================================

/**
 * Formats standard date string ("YYYY-MM-DD") to Indian standard display (e.g. "23 Oct 2027")
 */
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}T00:00:00`);
  if (isNaN(dateObj)) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats 24-hour time ("14:00") into 12-hour AM/PM format ("02:00 PM")
 */
function formatTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = hours < 10 ? `0${hours}` : hours;
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Helper to determine whether an event's attendance window is currently open
 * based on configurations set in Manage Events.
 */
function getEventWindowStatus(ev) {
  if (!ev) return false;
  // Ongoing events are actively running
  if (ev.status === "ongoing") return true;
  // Explicit open status or sample active event
  if (ev.attendanceStatus === "open" || ev.id === "EV002") return true;

  if (ev.attendanceOpen && ev.attendanceClose) {
    const now = new Date();
    const openTime = new Date(ev.attendanceOpen);
    const closeTime = new Date(ev.attendanceClose);
    return now >= openTime && now <= closeTime;
  }
  return false;
}

/**
 * Parses and extracts data from any QR code payload.
 * Supports:
 * - JSON: {"enrollmentNo":"24IT001", "eventId":"EV001", ...}
 * - Prefix string: "QR-EV001-24IT001", "AXON:EV001:24IT001", "EV001:24IT001"
 * - Plain enrollment string: "24IT001", "220130107054"
 * - URL parameters: "...?enrollment=24IT001&event=EV001"
 */
function parseQRCodeData(rawText) {
  if (!rawText || typeof rawText !== "string") return null;
  const trimmed = rawText.trim();

  // 1. Try JSON payload
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        enrollmentNo: parsed.enrollmentNo || parsed.enrollment || parsed.id || "",
        eventId: parsed.eventId || parsed.event || null,
        name: parsed.name || null,
        department: parsed.department || parsed.branch || null,
        raw: trimmed,
      };
    } catch (e) {
      // ignore & continue to next format
    }
  }

  // 2. Try URL format (e.g. https://axon.vgec.ac.in/checkin?enrollment=24IT001&event=EV001)
  if (trimmed.includes("?") && (trimmed.includes("enrollment=") || trimmed.includes("event="))) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `https://axon.vgec.ac.in/${trimmed}`);
      return {
        enrollmentNo: url.searchParams.get("enrollment") || url.searchParams.get("enrollmentNo") || "",
        eventId: url.searchParams.get("event") || url.searchParams.get("eventId") || null,
        raw: trimmed,
      };
    } catch (e) {
      // ignore & continue
    }
  }

  // 3. Try standard AXON QR pattern: QR-{eventId}-{enrollmentNo}
  const qrPrefixMatch = trimmed.match(/^QR[-_:]([A-Za-z0-9_-]+)[-_:]([A-Za-z0-9]+)$/i);
  if (qrPrefixMatch) {
    return {
      eventId: qrPrefixMatch[1],
      enrollmentNo: qrPrefixMatch[2],
      raw: trimmed,
    };
  }

  // 4. Try colon/dash format: EV001:24IT001 or EV001-24IT001
  const parts = trimmed.split(/[-_:]/);
  if (parts.length === 2 && parts[0].toUpperCase().startsWith("EV")) {
    return {
      eventId: parts[0],
      enrollmentNo: parts[1],
      raw: trimmed,
    };
  }

  // 5. Fallback: Entire string is enrollment number
  return {
    enrollmentNo: trimmed,
    eventId: null,
    raw: trimmed,
  };
}

/**
 * Realistic student participant pool based on VGEC enrollment structures
 * (combines mockData users and sample students shown in reference designs)
 */
const SAMPLE_STUDENT_POOL = [
  { enrollmentNo: "24IT001", name: "Priyansh Patel", department: "IT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24IT002", name: "Jinal Shah", department: "IT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24CE015", name: "Meet Desai", department: "CE", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24EC007", name: "Krisha Vora", department: "EC", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24IT010", name: "Dhruv Mehta", department: "IT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "220130107054", name: "Jeny Thesiya", department: "IT", year: "3rd Year", semester: 5 },
  { enrollmentNo: "220130107055", name: "Archi Patel", department: "IT", year: "3rd Year", semester: 5 },
  { enrollmentNo: "220130107056", name: "Riya Shah", department: "CE", year: "2nd Year", semester: 3 },
  { enrollmentNo: "220130107057", name: "Meet Parmar", department: "ICT", year: "4th Year", semester: 7 },
  { enrollmentNo: "220130107058", name: "Krishna Dave", department: "IT", year: "3rd Year", semester: 5 },
  { enrollmentNo: "220130107059", name: "Harsh Joshi", department: "CE", year: "3rd Year", semester: 5 },
  { enrollmentNo: "24IT018", name: "Tanvi Panchal", department: "IT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24CE032", name: "Smit Solanki", department: "CE", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24EC021", name: "Aayush Trivedi", department: "EC", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24ICT009", name: "Nirav Barot", department: "ICT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24IT025", name: "Khushi Prajapati", department: "IT", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24CE044", name: "Yash Makwana", department: "CE", year: "2nd Year", semester: 3 },
  { enrollmentNo: "24EC035", name: "Diya Rathod", department: "EC", year: "2nd Year", semester: 3 },
];

/**
 * Event-specific student registration mappings:
 * Each event has its OWN specific registered students based on registrations in AXON.
 * Only students registered for that specific event are shown in that event's sheet!
 */
const EVENT_REGISTERED_STUDENTS_MAP = {
  EV001: [
    "220130107054", // Jeny Thesiya (REG001)
    "220130107055", // Archi Patel (REG006)
    "24IT001",      // Priyansh Patel
    "24IT002",      // Jinal Shah
    "24CE015",      // Meet Desai
    "24EC007",      // Krisha Vora
    "24IT010",      // Dhruv Mehta
    "24IT018",      // Tanvi Panchal
  ],
  EV002: [
    "220130107054", // Jeny Thesiya (REG002)
    "220130107059", // Harsh Joshi (REG014)
    "24IT010",      // Dhruv Mehta
    "24IT018",      // Tanvi Panchal
    "24CE032",      // Smit Solanki
    "24ICT009",     // Nirav Barot
    "24IT025",      // Khushi Prajapati
  ],
  EV003: [
    "220130107054", // Jeny Thesiya (REG003)
    "220130107055", // Archi Patel (REG007)
    "220130107056", // Riya Shah
    "24CE015",      // Meet Desai
    "24EC021",      // Aayush Trivedi
    "24CE044",      // Yash Makwana
  ],
  EV004: [
    "220130107054", // Jeny Thesiya (REG004)
    "220130107057", // Meet Parmar (REG010)
    "24IT001",      // Priyansh Patel
    "24CE032",      // Smit Solanki
    "24EC035",      // Diya Rathod
  ],
  EV005: [
    "220130107054", // Jeny Thesiya (REG005)
    "220130107056", // Riya Shah (REG009)
    "24IT002",      // Jinal Shah
    "24EC007",      // Krisha Vora
    "24IT025",      // Khushi Prajapati
    "24CE044",      // Yash Makwana
  ],
  EV006: [
    "220130107057", // Meet Parmar (REG011)
    "24CE015",      // Meet Desai
    "24IT018",      // Tanvi Panchal
    "24ICT009",     // Nirav Barot
  ],
  EV007: [
    "220130107058", // Krishna Dave (REG012)
    "24IT001",      // Priyansh Patel
    "24IT010",      // Dhruv Mehta
    "24EC021",      // Aayush Trivedi
  ],
  EV008: [
    "220130107058", // Krishna Dave (REG013)
    "24IT002",      // Jinal Shah
    "24CE032",      // Smit Solanki
    "24EC035",      // Diya Rathod
  ],
};

/**
 * Service to simulate backend database operations
 */
const registrationService = {
  // Returns all events sorted to prioritize upcoming / ongoing events
  getAllEvents: () => {
    return [...mockEvents].sort((a, b) => {
      // Prioritize upcoming or ongoing events first
      const statusOrder = { ongoing: 0, upcoming: 1, draft: 2, past: 3, completed: 3 };
      const rankA = statusOrder[a.status] ?? 4;
      const rankB = statusOrder[b.status] ?? 4;
      if (rankA !== rankB) return rankA - rankB;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });
  },

  // Generates or fetches participant roster specifically registered for this event
  getParticipantsForEvent: (event) => {
    if (!event) return [];

    // 1. Get the list of enrollment numbers registered specifically for this event
    let registeredEnrollments = EVENT_REGISTERED_STUDENTS_MAP[event.id];

    if (!registeredEnrollments) {
      // For any newly created or custom events, filter students matching the event's eligibility
      registeredEnrollments = SAMPLE_STUDENT_POOL
        .filter((student) => {
          const deptMatch =
            !event.eligibleDepartments ||
            event.eligibleDepartments.length === 0 ||
            event.eligibleDepartments.includes(student.department);
          const yearNum = typeof student.year === "string" ? parseInt(student.year[0]) : student.year;
          const yearMatch =
            !event.eligibleYears ||
            event.eligibleYears.length === 0 ||
            event.eligibleYears.includes(yearNum);
          return deptMatch && yearMatch;
        })
        .slice(0, event.participantLimit || 8)
        .map((s) => s.enrollmentNo);
    }

    // 2. Map ONLY those students registered for this specific event
    return SAMPLE_STUDENT_POOL
      .filter((student) => registeredEnrollments.includes(student.enrollmentNo))
      .map((student, index) => {
        // Attendance status: First 2-3 are checked in (Present) by default, others Absent
        const isPresent = index < 3;
        const randomMinute = 10 + (index * 3);
        const formattedMin = randomMinute < 10 ? `0${randomMinute}` : randomMinute;

        return {
          id: `REG-${event.id}-${student.enrollmentNo}`,
          eventId: event.id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          department: student.department,
          year: student.year,
          semester: student.semester || 3,
          status: isPresent ? "present" : "absent",
          checkInTime: isPresent ? `10:${formattedMin} AM` : null,
          qrCode: `QR-${event.id}-${student.enrollmentNo}`,
        };
      });
  },
};

// ============================================================================
// MAIN COMPONENT: Registrations
// ============================================================================
export default function Registrations() {
  // ----------------------------------------------------
  // 1. STATE MANAGEMENT
  // ----------------------------------------------------

  // Master list of all available events (upcoming, ongoing, past)
  const [eventsList] = useState(() => registrationService.getAllEvents());

  // Nearest event (first upcoming/ongoing event) selected by default
  const nearestEvent = useMemo(() => {
    return (
      eventsList.find((ev) => ev.status === "upcoming" || ev.status === "ongoing") ||
      eventsList[0] ||
      null
    );
  }, [eventsList]);

  // Currently selected active event ID
  const [selectedEventId, setSelectedEventId] = useState(
    () => nearestEvent?.id || ""
  );

  // Active event object
  const selectedEvent = useMemo(() => {
    return eventsList.find((ev) => ev.id === selectedEventId) || nearestEvent;
  }, [eventsList, selectedEventId, nearestEvent]);

  // Attendance Window is determined by event configurations set in Manage Events:
  // - If event is ongoing, attendance is active
  // - Or if current time falls within [attendanceOpen, attendanceClose]
  // - Or if attendanceStatus is explicitly marked open
  const isAttendanceOpen = useMemo(() => {
    if (!selectedEvent) return false;

    // Ongoing events have attendance open
    if (selectedEvent.status === "ongoing") {
      return true;
    }

    // Time-based check matching configured window from Manage Events
    if (selectedEvent.attendanceOpen && selectedEvent.attendanceClose) {
      const now = new Date();
      const openTime = new Date(selectedEvent.attendanceOpen);
      const closeTime = new Date(selectedEvent.attendanceClose);
      if (now >= openTime && now <= closeTime) {
        return true;
      }
    }

    // Explicit status or mock event default
    if (selectedEvent.attendanceStatus === "open" || selectedEvent.id === "EV002") {
      return true;
    }

    return false;
  }, [selectedEvent]);

  // Event search query state for switching events
  const [eventSearchQuery, setEventSearchQuery] = useState("");
  const [isEventSearchFocused, setIsEventSearchFocused] = useState(false);

  // Student participant roster state for the active event
  const [participants, setParticipants] = useState([]);

  // Load participants whenever active event changes
  useEffect(() => {
    if (selectedEvent) {
      const storageKey = `axon_participants_${selectedEvent.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setParticipants(JSON.parse(stored));
          return;
        } catch (e) {
          console.error("Error parsing stored participants:", e);
        }
      }
      const initialRoster = registrationService.getParticipantsForEvent(selectedEvent);
      setParticipants(initialRoster);
      try {
        localStorage.setItem(storageKey, JSON.stringify(initialRoster));
      } catch (e) {
        console.error("Error writing initial participants to localStorage:", e);
      }
    }
  }, [selectedEvent]);

  // Keep localStorage synchronized whenever participants change locally
  useEffect(() => {
    if (selectedEvent && participants.length > 0) {
      try {
        localStorage.setItem(`axon_participants_${selectedEvent.id}`, JSON.stringify(participants));
      } catch (e) {
        console.error("Error saving participants to localStorage:", e);
      }
    }
  }, [selectedEvent, participants]);

  // Two-way synchronization: Listen for storage events when attendance changes in the new tab sheet
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (selectedEvent && e.key === `axon_participants_${selectedEvent.id}`) {
        try {
          if (e.newValue) {
            setParticipants(JSON.parse(e.newValue));
          }
        } catch (err) {
          console.error("Error syncing participants from storage event:", err);
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [selectedEvent]);

  // Student table search & status filters
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'present' | 'absent'

  // Modal display toggles
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false); // Eye button modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false); // Start Scanning modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false); // Mark Manually modal

  // Full-Screen QR Scanner states & hardware references
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraFacing, setCameraFacing] = useState("environment"); // "environment" | "user"
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isTrueFullscreen, setIsTrueFullscreen] = useState(false);
  const [scanResult, setScanResult] = useState(null); // active validated student badge / error banner
  const [recentScans, setRecentScans] = useState([]); // live verified check-in history feed
  const [scannerGunInput, setScannerGunInput] = useState(""); // handheld USB barcode gun / typing input
  const [manualEnrollmentInput, setManualEnrollmentInput] = useState("");
  const [scanMessage, setScanMessage] = useState(null);

  // ----------------------------------------------------
  // 2. COMPUTED COUNTS & FILTERED DATA
  // ----------------------------------------------------

  // 3 Boxes Statistics: Registered, Present, Absent
  const registeredCount = participants.length;
  const presentCount = useMemo(() => {
    return participants.filter((p) => p.status === "present").length;
  }, [participants]);
  const absentCount = registeredCount - presentCount;

  // Filtered events for the event search bar across upcoming, ongoing, and past
  const matchingEvents = useMemo(() => {
    const q = eventSearchQuery.trim().toLowerCase();
    if (!q) return eventsList;
    return eventsList.filter((ev) => {
      const name = ev.name.toLowerCase();
      const cat = ev.category.toLowerCase();
      const venue = (ev.venue || "").toLowerCase();
      const status = (ev.status || "").toLowerCase();
      const isPast = status === "completed" || status === "past";

      return (
        name.includes(q) ||
        cat.includes(q) ||
        venue.includes(q) ||
        status.includes(q) ||
        (isPast && "past".includes(q))
      );
    });
  }, [eventsList, eventSearchQuery]);

  // Filtered student participants for table display
  const filteredParticipants = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return participants.filter((p) => {
      // If attendance is open, allow filtering by present / absent
      if (isAttendanceOpen && statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      // Text search filter
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.enrollmentNo.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    });
  }, [participants, statusFilter, studentSearch, isAttendanceOpen]);

  // ----------------------------------------------------
  // 3. ATTENDANCE ACTIONS & HANDLERS
  // ----------------------------------------------------

  // Toggle single student's status between Present and Absent
  const handleToggleAttendance = (enrollmentNo) => {
    if (!isAttendanceOpen) {
      alert(
        `Attendance Window for "${selectedEvent?.name}" is not open yet. Attendance can only be taken when the window is open.`
      );
      return;
    }

    setParticipants((prev) =>
      prev.map((p) => {
        if (p.enrollmentNo === enrollmentNo) {
          const isCurrentlyPresent = p.status === "present";
          const now = new Date();
          const timeString = now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          return {
            ...p,
            status: isCurrentlyPresent ? "absent" : "present",
            checkInTime: isCurrentlyPresent ? null : timeString,
          };
        }
        return p;
      })
    );
  };

  // Audio synthesizer feedback (Web Audio API - crisp hardware scanner chime)
  const playBeep = (type = "success") => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        // High crisp chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === "warning") {
        // Warning triangle sound
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        // Low error buzz
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio autoplay policy catch
    }
  };

  // Full Screen Mode Controls
  const handleCloseScanner = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsTrueFullscreen(false);
    }
    setIsScanModalOpen(false);
    setScanResult(null);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsTrueFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsTrueFullscreen(false);
      }
    }
  };

  // Comprehensive QR Code Validator: Extracts student details & validates
  const handleValidateQR = (rawQRString) => {
    if (!selectedEvent || !rawQRString) return false;

    const parsed = parseQRCodeData(rawQRString);
    if (!parsed || !parsed.enrollmentNo) {
      playBeep("error");
      setScanResult({
        status: "invalid_qr",
        title: "Unrecognized QR Code",
        message: "The scanned QR code is malformed or does not contain student credentials.",
        raw: rawQRString,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
      return false;
    }

    const enrollment = parsed.enrollmentNo.trim().toUpperCase();

    // 1. Validation Rule: Is Attendance Window Open?
    if (!isAttendanceOpen) {
      playBeep("error");
      setScanResult({
        status: "window_closed",
        title: "Attendance Window Closed",
        message: `Attendance is not open for "${selectedEvent.name}". Please check attendance schedule in Manage Events.`,
        enrollmentNo: enrollment,
        raw: rawQRString,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
      return false;
    }

    // 2. Validation Rule: Event ID Check (Prevent wrong event passes)
    if (parsed.eventId && parsed.eventId.toUpperCase() !== selectedEvent.id.toUpperCase()) {
      playBeep("error");
      setScanResult({
        status: "event_mismatch",
        title: "Event Mismatch Pass",
        message: `This ticket was issued for Event "${parsed.eventId}", but you are currently scanning for "${selectedEvent.name}" (${selectedEvent.id}).`,
        enrollmentNo: enrollment,
        expectedEvent: selectedEvent.name,
        ticketEvent: parsed.eventId,
        raw: rawQRString,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
      return false;
    }

    // 3. Validation Rule: Student Registration Check
    const student = participants.find(
      (p) => p.enrollmentNo.trim().toUpperCase() === enrollment
    );

    if (!student) {
      playBeep("error");
      setScanResult({
        status: "not_registered",
        title: "Student Not Registered",
        message: `Enrollment number "${enrollment}" is not found in the official registrations list for "${selectedEvent.name}".`,
        enrollmentNo: enrollment,
        raw: rawQRString,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
      return false;
    }

    // 4. Validation Rule: Duplicate Attendance Check
    if (student.status === "present") {
      playBeep("warning");
      setScanResult({
        status: "already_present",
        title: "Already Checked In",
        message: `${student.name} was already marked Present at ${student.checkInTime || "earlier today"}. Duplicate scan detected.`,
        student,
        timestamp: new Date().toLocaleTimeString("en-IN"),
      });
      return true;
    }

    // 5. Successful Attendance Check-in & Validation
    const now = new Date();
    const timeString = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const updatedStudent = {
      ...student,
      status: "present",
      checkInTime: timeString,
    };

    setParticipants((prev) =>
      prev.map((p) =>
        p.enrollmentNo.trim().toUpperCase() === enrollment
          ? updatedStudent
          : p
      )
    );

    playBeep("success");

    setScanResult({
      status: "success",
      title: "Attendance Verified & Recorded!",
      message: `${student.name} has been verified and checked into ${selectedEvent.name}.`,
      student: updatedStudent,
      timestamp: timeString,
    });

    setRecentScans((prev) => [
      {
        id: Date.now(),
        status: "success",
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        department: student.department,
        time: timeString,
      },
      ...prev.slice(0, 9),
    ]);

    return true;
  };

  // Camera start / stop effect when full-screen scanner is open
  useEffect(() => {
    if (!isScanModalOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setIsCameraActive(false);
      setCameraError(null);
      return;
    }

    let active = true;

    async function startCamera() {
      try {
        setCameraError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera API is not supported in this browser.");
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err) {
        if (!active) return;
        setIsCameraActive(false);
        setCameraError(
          "Camera access is unavailable or permission was not granted. You can still scan using a handheld USB barcode scanner gun, upload a QR code image, or click the student passes below."
        );
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isScanModalOpen, cameraFacing]);

  // Continuous QR scan with native BarcodeDetector if available
  useEffect(() => {
    if (!isScanModalOpen || !isCameraActive || !("BarcodeDetector" in window)) return;

    let scanTimer = null;
    let isProcessing = false;

    try {
      const barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code", "code_128"] });

      scanTimer = setInterval(async () => {
        if (isProcessing || !videoRef.current || videoRef.current.readyState < 2) return;
        try {
          isProcessing = true;
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const rawVal = barcodes[0].rawValue;
            if (rawVal) {
              handleValidateQR(rawVal);
            }
          }
        } catch (e) {
          // Frame decode error ignored
        } finally {
          isProcessing = false;
        }
      }, 500);
    } catch (e) {
      console.warn("BarcodeDetector could not be initialized:", e);
    }

    return () => {
      if (scanTimer) clearInterval(scanTimer);
    };
  }, [isScanModalOpen, isCameraActive, selectedEvent, isAttendanceOpen, participants]);

  // Escape key listener to close full-screen scanner
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isScanModalOpen) {
        handleCloseScanner();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isScanModalOpen]);

  // Mark student Present via QR scan or manual input (wrapper for modals & buttons)
  const handleMarkPresent = (enrollmentNo) => {
    return handleValidateQR(enrollmentNo);
  };

  // ----------------------------------------------------
  // 4. ACTION 1: VIEW SHEET (OPEN IN NEW TAB WITH FULL FUNCTIONALITY)
  // ----------------------------------------------------
  const handleViewSheet = () => {
    if (!selectedEvent) return;

    // Ensure the latest participant roster and attendance statuses are in localStorage
    try {
      localStorage.setItem(
        `axon_participants_${selectedEvent.id}`,
        JSON.stringify(participants)
      );
    } catch (e) {
      console.error("Could not write to localStorage before opening sheet:", e);
    }

    // Open dedicated full-featured Attendance Sheet page in new tab
    const sheetUrl = `/volunteer/attendance-sheet/${selectedEvent.id}`;
    window.open(sheetUrl, "_blank");
  };

  // ----------------------------------------------------
  // 5. ACTION 2: EXPORT SHEET (CSV DOWNLOAD)
  // ----------------------------------------------------
  const handleExportSheet = (onlyPresent = false) => {
    if (!selectedEvent) return;

    const listToExport = onlyPresent
      ? participants.filter((p) => p.status === "present")
      : participants;

    if (listToExport.length === 0) {
      alert("No participant records available to export.");
      return;
    }

    // CSV Header Row
    const headers = [
      "Sr No",
      "Enrollment No",
      "Student Name",
      "Branch",
      "Academic Year",
      "Semester",
      "Attendance Status",
      "Check-in Time",
      "Event ID",
      "Event Name",
    ];

    // CSV Data Rows
    const dataRows = listToExport.map((p, index) => [
      index + 1,
      `"${p.enrollmentNo}"`,
      `"${p.name}"`,
      p.department,
      `"${p.year}"`,
      p.semester,
      p.status.toUpperCase(),
      `"${p.checkInTime || "N/A"}"`,
      selectedEvent.id,
      `"${selectedEvent.name}"`,
    ]);

    // Construct CSV file with UTF-8 BOM for flawless Excel compatibility
    const csvString =
      "\uFEFF" + [headers.join(","), ...dataRows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedTitle = selectedEvent.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `${sanitizedTitle}_${onlyPresent ? "Present_List" : "Attendance_Sheet"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. MAIN HEADING                                      */}
      {/* ==================================================== */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Registrations
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Monitor real-time attendee check-ins, verify live presence, and manage
          event rosters.
        </p>
      </div>

      {/* ==================================================== */}
      {/* 2. SEARCH BAR & START SCANNING BUTTON ROW            */}
      {/* Search bar on left + Start Scanning button on right  */}
      {/* ==================================================== */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar for selecting / switching events */}
        <div className="relative flex-1">
          <div className="flex items-center h-11 px-3.5 bg-white border border-gray-200 rounded-xl shadow-xs focus-within:border-[#7040d0] focus-within:ring-2 focus-within:ring-[#7040d0]/15 transition-all">
            <Search size={17} className="text-gray-400 shrink-0 mr-2.5" />
            <input
              type="text"
              value={eventSearchQuery}
              onChange={(e) => {
                setEventSearchQuery(e.target.value);
                setIsEventSearchFocused(true);
              }}
              onFocus={() => setIsEventSearchFocused(true)}
              placeholder={`Current: "${selectedEvent?.name || "Select Event"}" — type to switch event...`}
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none"
            />
            {eventSearchQuery && (
              <button
                type="button"
                onClick={() => setEventSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Interactive Event Dropdown (visible when focused or searching) */}
          {isEventSearchFocused && (
            <>
              {/* Backdrop to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsEventSearchFocused(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-72 overflow-y-auto divide-y divide-gray-100">
                <div className="p-2.5 bg-gray-50/90 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Event Roster (Upcoming, Ongoing, Past)</span>
                  <span className="text-[10px] text-gray-400 font-normal">
                    {matchingEvents.length} events
                  </span>
                </div>
                {matchingEvents.length > 0 ? (
                  matchingEvents.map((ev) => {
                    const isCurrent = ev.id === selectedEvent?.id;
                    const isOngoing = ev.status === "ongoing";
                    const isPast = ev.status === "completed" || ev.status === "past";
                    const isUpcoming = ev.status === "upcoming";
                    const evWindowOpen = getEventWindowStatus(ev);

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setSelectedEventId(ev.id);
                          setEventSearchQuery("");
                          setIsEventSearchFocused(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between text-xs hover:bg-purple-50/60 transition-colors ${
                          isCurrent ? "bg-purple-50/80 font-bold" : ""
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-semibold text-gray-800 truncate">
                            {ev.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {formatDate(ev.eventDate)} • {ev.venue || "VGEC"}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {/* Attendance Window Indicator */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                              evWindowOpen
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            <span>{evWindowOpen ? "🟢 Open" : "🟡 Closed"}</span>
                          </span>

                          {/* Event Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              isOngoing
                                ? "bg-emerald-100 text-emerald-800"
                                : isUpcoming
                                ? "bg-purple-100 text-[#7040d0]"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isOngoing ? "Ongoing" : isUpcoming ? "Upcoming" : "Past"}
                          </span>

                          {isCurrent && (
                            <Check size={14} className="text-[#7040d0] ml-1" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No matching events found for "{eventSearchQuery}".
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Start Scanning Button (commonly for all events) */}
        <button
          type="button"
          onClick={() => {
            setScanMessage(null);
            setIsScanModalOpen(true);
          }}
          className="h-11 px-5 bg-[#7040d0] hover:bg-[#5b32af] active:scale-[0.99] text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <QrCode size={18} className="text-white" />
          <span>Start Scanning</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* 3. NEAREST / SELECTED EVENT CARD                     */}
      {/* Displays nearest event by default or switched event  */}
      {/* Has Eye button to view full event details + window status*/}
      {/* ==================================================== */}
      {selectedEvent && (
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-5 relative overflow-hidden transition-all hover:border-purple-200">
          {/* Subtle Top Accent Gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7040d0] via-purple-500 to-indigo-500" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Event Details */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {selectedEvent.id === nearestEvent?.id && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-[#7040d0]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7040d0] animate-pulse" />
                    Nearest Event
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                  {selectedEvent.category || "Event"}
                </span>

                {/* Status Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedEvent.status === "ongoing"
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                      : selectedEvent.status === "upcoming"
                      ? "text-purple-700 bg-purple-50 border border-purple-200"
                      : "text-gray-700 bg-gray-100 border border-gray-200"
                  }`}
                >
                  {selectedEvent.status === "completed" ? "Past" : selectedEvent.status}
                </span>

                {/* Attendance Window Live Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isAttendanceOpen
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAttendanceOpen ? "bg-emerald-600 animate-pulse" : "bg-amber-600"
                    }`}
                  />
                  <span>
                    Attendance Window: {isAttendanceOpen ? "Open (Live)" : "Closed"}
                  </span>
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                {selectedEvent.name}
              </h2>

              {/* Event Metadata Row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#7040d0]" />
                  <span>{formatDate(selectedEvent.eventDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#7040d0]" />
                  <span>
                    {formatTime(selectedEvent.startTime)} -{" "}
                    {formatTime(selectedEvent.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#7040d0]" />
                  <span>{selectedEvent.venue || "VGEC Campus"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User size={14} className="text-[#7040d0]" />
                  <span>{selectedEvent.speakerName || "Speaker TBA"}</span>
                </div>
              </div>
            </div>

            {/* Right: Exactly ONE Eye button to view full event details */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0">
              {/* Eye Button for Full Overview */}
              <button
                type="button"
                onClick={() => setIsEventDetailsOpen(true)}
                title="View Full Event Details"
                className="p-2.5 bg-purple-50 text-[#7040d0] hover:bg-[#7040d0] hover:text-white rounded-xl border border-purple-200 transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold"
              >
                <Eye size={17} />
                <span className="hidden sm:inline">Event Overview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. STAT BOXES VIEW                                   */}
      {/* USER LOGIC:                                          */}
      {/* - If Attendance Window IS OPEN (upcoming/ongoing/past): */}
      {/*   Show all 3 boxes: Registered, Present, Absent.     */}
      {/* - If Attendance Window IS NOT OPEN (upcoming event): */}
      {/*   ONLY SHOW Registered box! Present and Absent boxes */}
      {/*   are completely hidden!                             */}
      {/* ==================================================== */}
      {isAttendanceOpen ? (
        // STATE 1: ATTENDANCE WINDOW IS OPEN -> SHOW ALL 3 BOXES
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {/* Box 1: Registered */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Registered
              </p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {registeredCount}
              </p>
            </div>
          </div>

          {/* Box 2: Present */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Present
              </p>
              <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {presentCount}
              </p>
            </div>
          </div>

          {/* Box 3: Absent */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UserX size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Absent
              </p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">
                {absentCount}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // STATE 2: ATTENDANCE WINDOW IS NOT OPEN -> ONLY SHOW HOW MANY REGISTERED!
        // (Present and Absent boxes are not shown, as requested)
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in duration-200">
          {/* ONLY Box 1: Registered is shown */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Registered
              </p>
              <p className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {registeredCount}
              </p>
            </div>
          </div>

          {/* Scheduled Attendance Information Banner in place of Present & Absent */}
          <div className="sm:col-span-2 bg-amber-50/70 rounded-2xl border border-amber-200/80 p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>Attendance Window Not Open Yet</span>
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Present and Absent metrics will appear once attendance opens for this event.
                </p>
                <p className="text-[11px] text-amber-700 mt-1 font-medium">
                  Scheduled Window: {formatDate(selectedEvent.attendanceOpen)} ({formatTime(selectedEvent.attendanceOpen?.split("T")[1])} - {formatTime(selectedEvent.attendanceClose?.split("T")[1])})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. ACTION BUTTONS (TOP INLINE BAR ABOVE SHEET)       */}
      {/* Mark Manually, View Present List, View Sheet, Export */}
      {/* ==================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
        <div className="text-xs text-gray-600 font-medium">
          Roster actions for <span className="font-bold text-gray-800">{selectedEvent?.name}</span>:
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Mark Manually Button */}
          <button
            type="button"
            onClick={() => {
              setManualEnrollmentInput("");
              setIsManualModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            title="Mark attendance manually by entering student enrollment number"
          >
            <UserCheck size={14} className="text-[#7040d0]" />
            <span>Mark Manually</span>
          </button>

          {/* 2. View Present List Button */}
          <button
            type="button"
            onClick={() => {
              if (!isAttendanceOpen) {
                alert(
                  `Attendance window is not open for "${selectedEvent?.name}". Present records will be available once attendance opens.`
                );
                return;
              }
              setStatusFilter(statusFilter === "present" ? "all" : "present");
            }}
            className={`px-3.5 py-2 border rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 ${
              statusFilter === "present"
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
            }`}
            title="Toggle to view students marked present"
          >
            <Users
              size={14}
              className={statusFilter === "present" ? "text-emerald-600" : "text-gray-500"}
            />
            <span>
              {statusFilter === "present"
                ? `Showing Present (${presentCount})`
                : `View Present List (${presentCount})`}
            </span>
          </button>

          {/* 3. View Sheet (Open in New Tab) Button */}
          <button
            type="button"
            onClick={handleViewSheet}
            className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ExternalLink size={14} className="text-[#7040d0]" />
            <span>View Sheet (Open in New Tab)</span>
          </button>

          {/* 4. Export Sheet Button (Single export button above sheet) */}
          <button
            type="button"
            onClick={() => handleExportSheet(false)}
            className="px-3.5 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Export Sheet</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 6. PARTICIPANT ATTENDANCE TABLE (REFERENCE DESIGN)   */}
      {/* Search by name/enrollment, status badges, manual mark*/}
      {/* ==================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        {/* Table Top Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Student Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              placeholder="Search by name or enrollment..."
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none transition-all"
            />
          </div>

          {/* Status Filter Tabs & Table Action */}
          <div className="flex items-center gap-2">
            {isAttendanceOpen ? (
              <div className="flex items-center bg-gray-100 p-1 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === "all"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All ({registeredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("present")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === "present"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-gray-600 hover:text-emerald-600"
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("absent")}
                  className={`px-3 py-1 rounded-md font-semibold transition-all ${
                    statusFilter === "absent"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-gray-600 hover:text-rose-600"
                  }`}
                >
                  Absent ({absentCount})
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                <Clock size={13} className="text-amber-600" />
                <span>Roster View ({registeredCount} Registered)</span>
              </div>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Enrollment No.</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Sem/Year</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Check-in Time</th>
                <th className="py-3 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredParticipants.length > 0 ? (
                filteredParticipants.map((student, index) => {
                  const isPresent = student.status === "present";
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-purple-50/20 transition-colors"
                    >
                      {/* # */}
                      <td className="py-3 px-4 text-center text-gray-400 font-medium">
                        {index + 1}
                      </td>

                      {/* 1. Enrollment No. */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900">
                        {student.enrollmentNo}
                      </td>

                      {/* 2. Name */}
                      <td className="py-3 px-4 text-gray-900 font-semibold">
                        {student.name}
                      </td>

                      {/* 3. Branch */}
                      <td className="py-3 px-4 text-gray-600">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold">
                          {student.department}
                        </span>
                      </td>

                      {/* 4. Sem/Year */}
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        Sem {student.semester || 3} / {student.year || "2nd Year"}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3 px-4 text-center">
                        {isAttendanceOpen ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isPresent
                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                : "bg-rose-100 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            Registered
                          </span>
                        )}
                      </td>

                      {/* 6. Check-in Time */}
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {isAttendanceOpen ? (
                          student.checkInTime ? (
                            <span className="font-semibold text-gray-900">
                              {student.checkInTime}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )
                        ) : (
                          <span className="text-gray-400 italic">Not Opened</span>
                        )}
                      </td>

                      {/* 7. Quick Action */}
                      <td className="py-3 px-4 text-right">
                        {isAttendanceOpen ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleAttendance(student.enrollmentNo)
                            }
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                              isPresent
                                ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            }`}
                          >
                            {isPresent ? "Mark Absent" : "Mark Present"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1 rounded-lg text-[11px] font-medium bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                            title="Attendance window is not open"
                          >
                            Window Closed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <p className="font-semibold text-sm">No students found</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Try adjusting your search query or filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Bar: Participant Count Summary */}
        <div className="p-3.5 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <p>
            Showing <strong className="text-gray-800 font-semibold">{filteredParticipants.length}</strong> of{" "}
            <strong className="text-gray-800 font-semibold">{registeredCount}</strong> registered participants
          </p>
          {statusFilter !== "all" && (
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="text-[#7040d0] hover:underline font-semibold text-xs"
            >
              Clear filter (Show All)
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL 1: EVENT DETAILS (EYE BUTTON ACTION)           */}
      {/* Expands to show full event details                   */}
      {/* ==================================================== */}
      {isEventDetailsOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Full Event Details
                </h3>
                <p className="text-xs text-gray-500">
                  Comprehensive event information & registration rules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEventDetailsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedEvent.name}
                </h2>
                <p className="text-[#7040d0] font-semibold mt-0.5">
                  {selectedEvent.category} • Status: {selectedEvent.status}
                </p>
              </div>

              {/* Schedule and Location */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-[#7040d0]" />
                  <span>{formatDate(selectedEvent.eventDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={15} className="text-[#7040d0]" />
                  <span>
                    {formatTime(selectedEvent.startTime)} -{" "}
                    {formatTime(selectedEvent.endTime)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#7040d0]" />
                  <span>{selectedEvent.venue || "VGEC Campus"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={15} className="text-[#7040d0]" />
                  <span>{selectedEvent.speakerName || "Speaker TBA"}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="font-semibold text-gray-800 mb-1">Description</p>
                <p className="text-gray-600 leading-relaxed bg-white border border-gray-100 p-3 rounded-xl">
                  {selectedEvent.description || "No description provided."}
                </p>
              </div>

              {/* Windows: Registration & Attendance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-1">
                    Registration Window
                  </p>
                  <p className="text-gray-600">
                    Opens: {selectedEvent.registrationOpen || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Closes: {selectedEvent.registrationClose || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-1">
                    Attendance Window
                  </p>
                  <p className="text-gray-600">
                    Opens: {selectedEvent.attendanceOpen || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Closes: {selectedEvent.attendanceClose || "N/A"}
                  </p>
                </div>
              </div>

              {/* Capacity and Registration Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-1">
                    Registered Students
                  </p>
                  <p className="text-base font-bold text-gray-900">
                    {registeredCount} / {selectedEvent.participantLimit || 100}
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <p className="font-semibold text-emerald-900 mb-1">
                    Attendance Rate
                  </p>
                  <p className="text-base font-bold text-emerald-700">
                    {registeredCount > 0
                      ? `${Math.round((presentCount / registeredCount) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Eligibility Criteria */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <p className="font-semibold text-gray-800">Eligibility Criteria</p>
                {selectedEvent.eligibleCombinations &&
                selectedEvent.eligibleCombinations.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedEvent.eligibleCombinations.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 bg-purple-100/70 text-[#7040d0] rounded text-[11px] font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Departments:{" "}
                    {selectedEvent.eligibleDepartments?.join(", ") || "All"} | Years:{" "}
                    {selectedEvent.eligibleYears
                      ? `Year ${selectedEvent.eligibleYears.join(", ")}`
                      : "All"}
                  </p>
                )}
              </div>

              {/* Rulebook */}
              {selectedEvent.rulebook && (
                <div className="flex items-center justify-between p-3 bg-gray-100 rounded-xl">
                  <span className="font-medium text-gray-700 flex items-center gap-2">
                    <FileText size={16} /> Rulebook: {selectedEvent.rulebook}
                  </span>
                  <span className="text-[#7040d0] font-semibold">Attached</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEventDetailsOpen(false)}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-xs font-semibold hover:bg-gray-900 transition-colors"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: FULL-SCREEN QR ATTENDANCE SCANNER MODE      */}
      {/* Complete full-screen immersive scanner with camera,  */}
      {/* HUD reticle, QR validation, student details display, */}
      {/* audio feedback, and USB barcode gun support         */}
      {/* ==================================================== */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-200">
          {/* 1. TOP HEADER & HUD BAR */}
          <header className="h-16 px-4 sm:px-6 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between shrink-0 z-20">
            {/* Left: Exit button & Event Info */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCloseScanner}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-semibold border border-gray-700 transition-colors shadow-xs"
                title="Exit Fullscreen Scanner (Esc)"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back to Registrations</span>
              </button>

              <div className="h-6 w-px bg-gray-800 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[160px] sm:max-w-xs md:max-w-md">
                    {selectedEvent?.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAttendanceOpen
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {isAttendanceOpen ? "Window Open" : "Window Closed"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 hidden sm:block">
                  {selectedEvent?.category} • {formatDate(selectedEvent?.eventDate)} • {selectedEvent?.venue || "VGEC Campus"}
                </p>
              </div>
            </div>

            {/* Center: Live Attendance Stats Pill */}
            <div className="hidden md:flex items-center gap-4 bg-gray-950/80 px-4 py-1.5 rounded-xl border border-gray-800">
              <div className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Turnout</span>
                <span className="text-xs font-bold text-purple-400">
                  {registeredCount > 0 ? `${Math.round((presentCount / registeredCount) * 100)}%` : "0%"}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <div className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Present</span>
                <span className="text-xs font-bold text-emerald-400">{presentCount}</span>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <div className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Absent</span>
                <span className="text-xs font-bold text-rose-400">{absentCount}</span>
              </div>
              <div className="h-6 w-px bg-gray-800" />
              <div className="text-center">
                <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total</span>
                <span className="text-xs font-bold text-gray-200">{registeredCount}</span>
              </div>
            </div>

            {/* Right: Controls (Sound, Camera switch, Fullscreen, Close) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Audio Beep Mute Toggle */}
              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                title={isMuted ? "Unmute scanner chime" : "Mute scanner chime"}
                className={`p-2 rounded-xl text-xs font-medium border transition-colors ${
                  isMuted
                    ? "bg-rose-950/40 text-rose-400 border-rose-800"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:text-white"
                }`}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>

              {/* Camera Switch (Front/Back) */}
              <button
                type="button"
                onClick={() =>
                  setCameraFacing((prev) => (prev === "environment" ? "user" : "environment"))
                }
                title="Switch Camera (Front/Rear)"
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-colors"
              >
                <RotateCw size={16} />
              </button>

              {/* Native Browser Fullscreen Toggle */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                title={isTrueFullscreen ? "Exit True Fullscreen" : "Enter True Fullscreen"}
                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl border border-gray-700 transition-colors hidden sm:flex"
              >
                {isTrueFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              {/* Close Scanner Button */}
              <button
                type="button"
                onClick={handleCloseScanner}
                className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 rounded-xl border border-red-800/80 transition-colors ml-1"
                title="Close Scanner"
              >
                <X size={17} />
              </button>
            </div>
          </header>

          {/* 2. MAIN SCANNER BODY (FULL-SCREEN VIEWFINDER & HUD) */}
          <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
            {/* Live Video Camera Stream */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isCameraActive ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Holographic scanner backdrop when camera is loading or inactive */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-radial from-gray-900 via-gray-950 to-black z-0">
                  <div className="w-20 h-20 rounded-2xl bg-[#7040d0]/10 border border-[#7040d0]/30 flex items-center justify-center text-[#7040d0] mb-4 shadow-[0_0_30px_rgba(112,64,208,0.2)]">
                    <Camera size={36} className="animate-pulse" />
                  </div>
                  <h3 className="text-base font-bold text-gray-200">
                    High-Tech Optical Scanner Ready
                  </h3>
                  <p className="text-xs text-gray-400 max-w-sm mt-1.5 leading-relaxed">
                    {cameraError ||
                      "Camera is initializing... Point student QR codes towards the camera or use the USB barcode gun / demo passes on the right."}
                  </p>
                </div>
              )}

              {/* SCANNER RETICLE & LASER HUD */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 p-6">
                <div className="relative w-72 h-72 sm:w-84 sm:h-84 max-w-[85vw] max-h-[85vw] rounded-3xl border-2 border-[#7040d0]/40 shadow-[0_0_50px_rgba(112,64,208,0.25)] flex items-center justify-center overflow-hidden">
                  {/* Glowing Corner Reticle Brackets */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#7040d0] rounded-tl-2xl shadow-[0_0_12px_#7040d0]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#7040d0] rounded-tr-2xl shadow-[0_0_12px_#7040d0]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#7040d0] rounded-bl-2xl shadow-[0_0_12px_#7040d0]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#7040d0] rounded-br-2xl shadow-[0_0_12px_#7040d0]" />

                  {/* High-Tech Sweeping Laser Beam */}
                  <div className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-[#7040d0] to-transparent shadow-[0_0_16px_#a855f7] animate-bounce" />

                  {/* Center Target Aiming Crosshair */}
                  <div className="w-12 h-12 rounded-full border border-purple-500/30 flex items-center justify-center opacity-60">
                    <div className="w-1.5 h-1.5 bg-[#7040d0] rounded-full shadow-[0_0_8px_#7040d0]" />
                  </div>

                  {/* Subtext HUD overlay */}
                  <div className="absolute bottom-3 text-center">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-purple-300 bg-gray-950/70 px-2.5 py-0.5 rounded-full border border-purple-500/30 backdrop-blur-xs">
                      Align Student QR Code
                    </span>
                  </div>
                </div>
              </div>

              {/* OVERLAY: VALIDATION RESULT CARD (STUDENT DETAILS & VERIFICATION) */}
              {scanResult && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-150">
                  <div
                    className={`w-full max-w-md rounded-2xl shadow-2xl border p-6 space-y-4 text-left ${
                      scanResult.status === "success"
                        ? "bg-gray-900 border-emerald-500/50 shadow-emerald-500/20"
                        : scanResult.status === "already_present"
                        ? "bg-gray-900 border-amber-500/50 shadow-amber-500/20"
                        : "bg-gray-900 border-rose-500/50 shadow-rose-500/20"
                    }`}
                  >
                    {/* Header with status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-3 rounded-xl ${
                            scanResult.status === "success"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : scanResult.status === "already_present"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          }`}
                        >
                          {scanResult.status === "success" ? (
                            <CheckCircle2 size={26} />
                          ) : scanResult.status === "already_present" ? (
                            <AlertCircle size={26} />
                          ) : (
                            <ShieldAlert size={26} />
                          )}
                        </div>

                        <div>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${
                              scanResult.status === "success"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : scanResult.status === "already_present"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {scanResult.status === "success"
                              ? "ENTRY GRANTED • VERIFIED"
                              : scanResult.status === "already_present"
                              ? "DUPLICATE SCAN PREVENTED"
                              : "VALIDATION REJECTED"}
                          </span>
                          <h3 className="text-base font-bold text-white mt-1">
                            {scanResult.title}
                          </h3>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setScanResult(null)}
                        className="text-gray-400 hover:text-white p-1 rounded-lg"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {scanResult.message}
                    </p>

                    {/* Verified Student Details Card */}
                    {scanResult.student && (
                      <div className="bg-gray-950/80 rounded-xl p-4 border border-gray-800 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-gray-800/80 pb-2">
                          <span className="text-[11px] text-gray-400 uppercase font-semibold">
                            Student Name
                          </span>
                          <span className="text-sm font-bold text-white">
                            {scanResult.student.name}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Enrollment No.
                            </span>
                            <span className="font-mono font-bold text-purple-300">
                              {scanResult.student.enrollmentNo}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Branch / Dept
                            </span>
                            <span className="font-semibold text-gray-200">
                              {scanResult.student.department} • {scanResult.student.year}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-800/80">
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Check-In Time
                            </span>
                            <span className="font-bold text-emerald-400">
                              {scanResult.student.checkInTime || scanResult.timestamp}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                              Pass ID
                            </span>
                            <span className="font-mono text-gray-400 text-[11px]">
                              {scanResult.student.id}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setScanResult(null)}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                          scanResult.status === "success"
                            ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                            : "bg-[#7040d0] hover:bg-[#5b32af]"
                        }`}
                        autoFocus
                      >
                        <Check size={16} />
                        <span>Ready for Next Student</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: MARK MANUALLY MODAL                         */}
      {/* Quick check-in by entering enrollment number         */}
      {/* ==================================================== */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Mark Attendance Manually
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter the student's enrollment number to mark them Present for{" "}
              <span className="font-semibold text-gray-800">{selectedEvent?.name}</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                value={manualEnrollmentInput}
                onChange={(e) => setManualEnrollmentInput(e.target.value)}
                placeholder="e.g. 24IT001 or 220130107054"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:bg-white focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]/20 outline-none uppercase"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-3.5 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!manualEnrollmentInput.trim()) return;
                  const success = handleMarkPresent(manualEnrollmentInput);
                  if (success) {
                    setIsManualModalOpen(false);
                  }
                }}
                className="px-4 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Confirm Present
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
