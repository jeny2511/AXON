import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  UserCheck,
  UserX,
  FileText,
  Sparkles,
  RotateCcw,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { events as mockEvents } from "../../mockData";
import api from "../../services/api.js";

// ============================================================================
// HELPER FUNCTIONS & SHARED STORAGE UTILITIES
// ============================================================================

const getStorageKey = (eventId) => `axon_participants_${eventId}`;

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
 */
function getEventWindowStatus(ev) {
  if (!ev) return false;
  if (ev.status === "ongoing") return true;
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
 * Default sample roster for events when localStorage is not yet populated
 */
const DEFAULT_STUDENT_POOL = [
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

// ============================================================================
// MAIN COMPONENT: AttendanceSheet (Opened in New Tab)
// Complete full-screen attendance sheet with all functionalities:
// - Live search by student name, enrollment, or department
// - Filter by status (All, Present, Absent)
// - Sorting (by serial, enrollment, name, branch)
// - Interactive attendance marking (Present / Absent)
// - Manual attendance check-in modal
// - Official Print Sheet layout with coordinator signature section
// - CSV Export (All participants & Present only)
// ============================================================================
export default function AttendanceSheet() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Find target event by ID or fallback to first event
  const currentEvent = useMemo(() => {
    const cachedEvents = localStorage.getItem("axon_live_events");
    let allEvents = [...mockEvents];
    if (cachedEvents) {
      try {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) allEvents = parsed;
      } catch {}
    }
    return allEvents.find((e) => e.id === eventId || e._id === eventId) || allEvents[0];
  }, [eventId]);

  const isAttendanceOpen = useMemo(() => {
    return getEventWindowStatus(currentEvent);
  }, [currentEvent]);

  // Live fetch participants from backend API
  useEffect(() => {
    if (currentEvent) {
      const targetId = currentEvent._id || currentEvent.id;
      api.get(`/registrations/event/${targetId}/participants`)
        .then((res) => {
          if (res && res.success && Array.isArray(res.participants) && res.participants.length > 0) {
            const mapped = res.participants.map((p) => {
              const isPresent = p.attendanceStatus === "present" || p.hasAttended;
              return {
                id: p.registrationId || `REG-${currentEvent.id}-${p.enrollmentNo || p.enrollmentNumber}`,
                eventId: currentEvent.id,
                enrollmentNo: p.enrollmentNo || p.enrollmentNumber,
                name: p.name || p.fullName,
                department: p.department || "IT",
                year: p.batch ? `${p.batch} Batch` : (p.year || "3rd Year"),
                semester: p.semester || 5,
                status: isPresent ? "present" : "absent",
                checkInTime: isPresent ? "10:15 AM" : null,
                qrCode: p.qrCode || `QR-${currentEvent.id}-${p.enrollmentNo || p.enrollmentNumber}`,
              };
            });
            setParticipants(mapped);
            try {
              localStorage.setItem(getStorageKey(currentEvent.id), JSON.stringify(mapped));
            } catch {}
          }
        })
        .catch(() => {});
    }
  }, [currentEvent]);

  // Load participants from localStorage or synthesize default roster for this specific event
  const [participants, setParticipants] = useState(() => {
    if (!currentEvent) return [];
    try {
      const stored = localStorage.getItem(getStorageKey(currentEvent.id));
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load attendance from storage:", e);
    }

    // 1. Get registered enrollment numbers specifically for this event
    let registeredEnrollments = EVENT_REGISTERED_STUDENTS_MAP[currentEvent.id];

    if (!registeredEnrollments) {
      registeredEnrollments = DEFAULT_STUDENT_POOL
        .filter((student) => {
          const deptMatch =
            !currentEvent.eligibleDepartments ||
            currentEvent.eligibleDepartments.length === 0 ||
            currentEvent.eligibleDepartments.includes(student.department);
          const yearNum = typeof student.year === "string" ? parseInt(student.year[0]) : student.year;
          const yearMatch =
            !currentEvent.eligibleYears ||
            currentEvent.eligibleYears.length === 0 ||
            currentEvent.eligibleYears.includes(yearNum);
          return deptMatch && yearMatch;
        })
        .slice(0, currentEvent.participantLimit || 8)
        .map((s) => s.enrollmentNo);
    }

    // 2. Synthesize ONLY the students registered for this specific event
    return DEFAULT_STUDENT_POOL
      .filter((student) => registeredEnrollments.includes(student.enrollmentNo))
      .map((student, index) => {
        const isPresent = index < 3;
        const randomMinute = 10 + index * 3;
        const formattedMin = randomMinute < 10 ? `0${randomMinute}` : randomMinute;

        return {
          id: `REG-${currentEvent.id}-${student.enrollmentNo}`,
          eventId: currentEvent.id,
          enrollmentNo: student.enrollmentNo,
          name: student.name,
          department: student.department,
          year: student.year,
          semester: student.semester || 3,
          status: isPresent ? "present" : "absent",
          checkInTime: isPresent ? `10:${formattedMin} AM` : null,
          qrCode: `QR-${currentEvent.id}-${student.enrollmentNo}`,
        };
      });
  });

  // Sync state changes to localStorage
  useEffect(() => {
    if (currentEvent && participants.length > 0) {
      try {
        localStorage.setItem(
          getStorageKey(currentEvent.id),
          JSON.stringify(participants)
        );
      } catch (e) {
        console.error("Failed to save attendance:", e);
      }
    }
  }, [currentEvent, participants]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'present' | 'absent'
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("index"); // 'index' | 'name' | 'enrollment' | 'time'

  // Manual Check-in Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEnrollmentInput, setManualEnrollmentInput] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState(null);

  // Statistics
  const registeredCount = participants.length;
  const presentCount = useMemo(() => {
    return participants.filter((p) => p.status === "present").length;
  }, [participants]);
  const absentCount = registeredCount - presentCount;
  const attendanceRate = registeredCount > 0 ? Math.round((presentCount / registeredCount) * 100) : 0;

  // Filtered & Sorted participants
  const displayedParticipants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = participants.filter((p) => {
      // Status filter
      if (isAttendanceOpen && statusFilter !== "all" && p.status !== statusFilter) {
        return false;
      }
      // Department filter
      if (departmentFilter !== "all" && p.department !== departmentFilter) {
        return false;
      }
      // Text search
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.enrollmentNo.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q)
      );
    });

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "enrollment") return a.enrollmentNo.localeCompare(b.enrollmentNo);
      if (sortBy === "time") {
        if (!a.checkInTime) return 1;
        if (!b.checkInTime) return -1;
        return a.checkInTime.localeCompare(b.checkInTime);
      }
      return 0; // default index
    });
  }, [participants, searchQuery, statusFilter, departmentFilter, sortBy, isAttendanceOpen]);

  // Toggle single student's status
  const handleToggleAttendance = (enrollmentNo) => {
    if (!isAttendanceOpen) {
      alert(`Attendance Window for "${currentEvent?.name}" is not open. Window is managed in Manage Events.`);
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

    if (currentEvent) {
      const student = participants.find((p) => p.enrollmentNo === enrollmentNo);
      const isCurrentlyPresent = student?.status === "present";
      if (!isCurrentlyPresent) {
        api.post("/attendance/manual", {
          eventId: currentEvent._id || currentEvent.id,
          enrollmentNumber: enrollmentNo,
          reason: "Manual attendance toggle in Attendance Sheet",
        }).catch((err) => {
          console.warn("Live attendance sync notice:", err?.message || err);
        });
      }
    }
  };

  // Mark Present manually
  const handleMarkPresent = (enrollmentNo) => {
    if (!isAttendanceOpen) {
      setFeedbackNotice({
        type: "error",
        text: `Attendance Window is closed for "${currentEvent?.name}".`,
      });
      return false;
    }

    const targetStudent = participants.find(
      (p) => p.enrollmentNo.toLowerCase() === enrollmentNo.trim().toLowerCase()
    );

    if (!targetStudent) {
      setFeedbackNotice({
        type: "error",
        text: `Student with enrollment "${enrollmentNo}" is not registered.`,
      });
      return false;
    }

    if (targetStudent.status === "present") {
      setFeedbackNotice({
        type: "info",
        text: `${targetStudent.name} (${targetStudent.enrollmentNo}) is already marked Present.`,
      });
      return true;
    }

    const now = new Date();
    const timeString = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    setParticipants((prev) =>
      prev.map((p) =>
        p.enrollmentNo.toLowerCase() === enrollmentNo.trim().toLowerCase()
          ? { ...p, status: "present", checkInTime: timeString }
          : p
      )
    );

    if (currentEvent) {
      api.post("/attendance/manual", {
        eventId: currentEvent._id || currentEvent.id,
        enrollmentNumber: targetStudent.enrollmentNo,
        reason: "Manual check-in modal in Attendance Sheet",
      }).catch((err) => {
        console.warn("Live attendance sync notice:", err?.message || err);
      });
    }

    setFeedbackNotice({
      type: "success",
      text: `✓ Verified: ${targetStudent.name} marked Present at ${timeString}.`,
    });
    return true;
  };

  // Export Sheet to CSV
  const handleExportCSV = (onlyPresent = false) => {
    const listToExport = onlyPresent
      ? participants.filter((p) => p.status === "present")
      : participants;

    if (listToExport.length === 0) {
      alert("No student records available to export.");
      return;
    }

    const headers = [
      "Sr No",
      "Enrollment No",
      "Student Name",
      "Branch",
      "Academic Year",
      "Semester",
      "Attendance Status",
      "Check-in Time",
      "Event Name",
      "Event Date",
    ];

    const dataRows = listToExport.map((p, index) => [
      index + 1,
      `"${p.enrollmentNo}"`,
      `"${p.name}"`,
      p.department,
      `"${p.year}"`,
      p.semester,
      p.status.toUpperCase(),
      `"${p.checkInTime || "N/A"}"`,
      `"${currentEvent.name}"`,
      `"${currentEvent.eventDate}"`,
    ]);

    const csvString =
      "\uFEFF" + [headers.join(","), ...dataRows.map((row) => row.join(","))].join("\r\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const sanitizedTitle = currentEvent.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `${sanitizedTitle}_${onlyPresent ? "Present_List" : "Attendance_Roster"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50/60 p-4 sm:p-8 font-sans antialiased text-gray-900 print:bg-white print:p-0">
      {/* Top Application Bar (Hidden on print) */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() => {
            if (window.opener) {
              window.close();
            } else {
              navigate("/volunteer/registrations");
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg shadow-xs transition-colors"
        >
          <ArrowLeft size={15} />
          <span>Back to Registrations</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Printer size={15} className="text-[#7040d0]" />
            <span>Print Official Sheet</span>
          </button>

          {/* Export CSV (All) */}
          <button
            type="button"
            onClick={() => handleExportCSV(false)}
            className="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download size={15} className="text-[#7040d0]" />
            <span>Export Roster (CSV)</span>
          </button>

          {/* Export CSV (Present Only) */}
          <button
            type="button"
            onClick={() => handleExportCSV(true)}
            className="px-3.5 py-1.5 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>Export Present List</span>
          </button>
        </div>
      </div>

      {/* Main Printable Container */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-2">
        {/* ==================================================== */}
        {/* OFFICIAL HEADER SECTION                              */}
        {/* ==================================================== */}
        <div className="border-b-2 border-[#7040d0] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-[#7040d0] text-white rounded text-[10px] font-extrabold uppercase tracking-widest">
                AXON • TCF
              </span>
              <span className="text-xs text-gray-500 font-medium">
                Vishwakarma Government Engineering College (VGEC)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1 tracking-tight">
              Official Event Attendance & Registration Sheet
            </h1>
            <p className="text-xs text-gray-600 mt-0.5">
              Verified Student Roster for Academic Year 2026-2027
            </p>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isAttendanceOpen
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAttendanceOpen ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`}
              />
              <span>
                Attendance Window: {isAttendanceOpen ? "Open (Active)" : "Closed"}
              </span>
            </span>
            <p className="text-[11px] text-gray-400 mt-1">
              Event Code: <span className="font-mono font-bold text-gray-700">{currentEvent.id}</span>
            </p>
          </div>
        </div>

        {/* ==================================================== */}
        {/* EVENT METADATA GRID                                  */}
        {/* ==================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 bg-gray-50/80 rounded-xl border border-gray-200/90 text-xs">
          <div>
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">
              Event Name
            </span>
            <span className="font-bold text-gray-900 text-sm">
              {currentEvent.name}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">
              Date & Schedule
            </span>
            <span className="font-medium text-gray-800">
              {formatDate(currentEvent.eventDate)} ({formatTime(currentEvent.startTime)} - {formatTime(currentEvent.endTime)})
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">
              Venue
            </span>
            <span className="font-medium text-gray-800">
              {currentEvent.venue || "VGEC Campus"}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-gray-500 uppercase font-semibold block">
              Speaker / Coordinator
            </span>
            <span className="font-medium text-gray-800">
              {currentEvent.speakerName || "Faculty / TCF Team"}
            </span>
          </div>
        </div>

        {/* ==================================================== */}
        {/* STATS KPI CARDS                                      */}
        {/* When Attendance Window IS OPEN: All 3 boxes shown     */}
        {/* When Attendance Window IS CLOSED: Only Registered box */}
        {/* ==================================================== */}
        {isAttendanceOpen ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-center">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Total Registered
              </span>
              <p className="text-2xl font-black text-blue-900 mt-0.5">
                {registeredCount}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Present
              </span>
              <p className="text-2xl font-black text-emerald-900 mt-0.5">
                {presentCount}
              </p>
            </div>

            <div className="p-4 bg-rose-50/70 border border-rose-200/80 rounded-xl text-center">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Absent
              </span>
              <p className="text-2xl font-black text-rose-900 mt-0.5">
                {absentCount}
              </p>
            </div>

            <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl text-center">
              <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">
                Turnout Rate
              </span>
              <p className="text-2xl font-black text-[#7040d0] mt-0.5">
                {attendanceRate}%
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-center">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Total Registered
              </span>
              <p className="text-2xl font-black text-blue-900 mt-0.5">
                {registeredCount}
              </p>
            </div>

            <div className="sm:col-span-2 p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
                <Clock size={20} />
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-900">
                  Attendance Window is Not Open
                </p>
                <p className="text-amber-800 mt-0.5">
                  Scheduled window: {formatDate(currentEvent.attendanceOpen)} ({formatTime(currentEvent.attendanceOpen?.split("T")[1])} - {formatTime(currentEvent.attendanceClose?.split("T")[1])}). Present & Absent metrics will appear once attendance opens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* INTERACTIVE CONTROLS BAR (Hidden on print)           */}
        {/* Search, Filter Tabs, Department Filter, Mark Manually*/}
        {/* ==================================================== */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 print:hidden">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or enrollment..."
              className="w-full h-9 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#7040d0] outline-none"
            />
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs (Only active if window is open) */}
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
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                Roster List ({registeredCount})
              </span>
            )}

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="h-9 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none"
            >
              <option value="all">All Branches</option>
              <option value="IT">IT</option>
              <option value="CE">CE</option>
              <option value="EC">EC</option>
              <option value="ICT">ICT</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-9 px-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none"
            >
              <option value="index">Sort: Default Index</option>
              <option value="enrollment">Sort: Enrollment No</option>
              <option value="name">Sort: Student Name</option>
              <option value="time">Sort: Check-in Time</option>
            </select>

            {/* Mark Manually Button */}
            {isAttendanceOpen && (
              <button
                type="button"
                onClick={() => {
                  setFeedbackNotice(null);
                  setManualEnrollmentInput("");
                  setIsManualModalOpen(true);
                }}
                className="h-9 px-3 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
              >
                <UserCheck size={14} className="text-[#7040d0]" />
                <span>Mark Manually</span>
              </button>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* PARTICIPANTS TABLE                                   */}
        {/* ==================================================== */}
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100/80 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5">Enrollment No.</th>
                <th className="py-3 px-3.5">Name</th>
                <th className="py-3 px-3.5">Branch</th>
                <th className="py-3 px-3.5">Sem/Year</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5">Check-in Time</th>
                <th className="py-3 px-3.5 text-right print:hidden">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedParticipants.length > 0 ? (
                displayedParticipants.map((student, index) => {
                  const isPresent = student.status === "present";
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-purple-50/20 transition-colors"
                    >
                      {/* # */}
                      <td className="py-2.5 px-3.5 text-center text-gray-400 font-medium">
                        {index + 1}
                      </td>

                      {/* 1. Enrollment No. */}
                      <td className="py-2.5 px-3.5 font-bold text-gray-900 font-mono">
                        {student.enrollmentNo}
                      </td>

                      {/* 2. Name */}
                      <td className="py-2.5 px-3.5 text-gray-900 font-semibold">
                        {student.name}
                      </td>

                      {/* 3. Branch */}
                      <td className="py-2.5 px-3.5">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-semibold">
                          {student.department}
                        </span>
                      </td>

                      {/* 4. Sem/Year */}
                      <td className="py-2.5 px-3.5 text-gray-600 font-medium">
                        Sem {student.semester || 3} / {student.year || "2nd Year"}
                      </td>

                      {/* 5. Status */}
                      <td className="py-2.5 px-3.5 text-center">
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
                      <td className="py-2.5 px-3.5 text-gray-700 font-medium">
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
                      <td className="py-2.5 px-3.5 text-right print:hidden">
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
                          <span className="text-[11px] text-gray-400">
                            Window Closed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">
                    <p className="font-semibold text-sm">No students match your filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================== */}
        {/* OFFICIAL SIGNATURE FOOTER (Visible on print & screen) */}
        {/* ==================================================== */}
        <div className="pt-8 border-t border-gray-200 grid grid-cols-3 gap-8 text-center text-xs text-gray-600">
          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Volunteer In-Charge</p>
            <p className="text-[11px] text-gray-500">The Cyber Force (TCF)</p>
          </div>

          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Faculty Coordinator</p>
            <p className="text-[11px] text-gray-500">VGEC Cybersecurity Club</p>
          </div>

          <div>
            <div className="border-b border-gray-400 w-40 mx-auto mb-2" />
            <p className="font-bold text-gray-800">Head of Department (IT)</p>
            <p className="text-[11px] text-gray-500">VGEC Chandkheda</p>
          </div>
        </div>
      </div>

      {/* Manual Check-in Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm print:hidden">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Mark Student Present
              </h3>
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {feedbackNotice && (
              <div
                className={`p-2.5 rounded-lg text-xs font-semibold ${
                  feedbackNotice.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {feedbackNotice.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Enrollment Number
              </label>
              <input
                type="text"
                value={manualEnrollmentInput}
                onChange={(e) => setManualEnrollmentInput(e.target.value)}
                placeholder="e.g. 24IT001 or 220130107054"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:bg-white focus:border-[#7040d0] uppercase"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="px-3.5 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualEnrollmentInput.trim()) {
                    handleMarkPresent(manualEnrollmentInput);
                  }
                }}
                className="px-4 py-1.5 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-xs"
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
