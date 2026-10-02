import { useState, useMemo, useEffect } from "react";
import "./pages.css";
import "./MyEvents.css";

import StudentLayout from "../layouts/StudentLayout";
import CertificateView from "../components/CertificateView";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  Award,
  MessageSquare,
  X,
  FileText,
  User,
  Search,
  AlertCircle,
} from "lucide-react";

import {
  getActiveStudentId,
  getStudentProfile,
  getStudentRegistrations,
  fetchStudentRegistrations,
  fetchStudentAttendance,
  fetchStudentCertificates,
  fetchEvents,
  getEventById,
  getStudentAttendanceForEvent,
  getStudentCertificateForEvent,
  hasSubmittedFeedback,
  submitStudentFeedback,
  getEventFeedbackForm,
  fetchEventFeedbackForm,
  fetchStudentFeedbackSubmissions,
} from "../services/studentService";

// Format date string into "DD MMM YYYY"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format 24-hour time string into 12-hour format ("02:00 PM")
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

function MyEvents() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const [, setSyncTick] = useState(0);

  useEffect(() => {
    fetchEvents().catch(() => {});
    fetchStudentRegistrations(studentId).then(() => setSyncTick((t) => t + 1));
    fetchStudentAttendance(studentId).then(() => setSyncTick((t) => t + 1));
    fetchStudentCertificates(studentId).then(() => setSyncTick((t) => t + 1));
    fetchStudentFeedbackSubmissions().then(() => setSyncTick((t) => t + 1));

    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener("axon-registrations-change", handleSync);
    window.addEventListener("axon-attendance-change", handleSync);
    window.addEventListener("axon-certificates-change", handleSync);
    window.addEventListener("axon-events-change", handleSync);
    window.addEventListener("axon-feedback-change", handleSync);

    return () => {
      window.removeEventListener("axon-registrations-change", handleSync);
      window.removeEventListener("axon-attendance-change", handleSync);
      window.removeEventListener("axon-certificates-change", handleSync);
      window.removeEventListener("axon-events-change", handleSync);
      window.removeEventListener("axon-feedback-change", handleSync);
    };
  }, [studentId]);

  const registrations = getStudentRegistrations(studentId);

  const myEvents = registrations
    .map((registration) => {
      const event = registration.event || getEventById(registration.eventId);
      if (!event) return null;
      return {
        ...event,
        registrationId: registration.registrationId,
        registrationStatus: registration.status,
        qrCode: registration.qrCode,
      };
    })
    .filter(Boolean);

  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [selectedFeedbackEvent, setSelectedFeedbackEvent] = useState(null);
  const [selectedQREvent, setSelectedQREvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return myEvents;
    const term = searchTerm.toLowerCase();
    return myEvents.filter((event) => {
      const matchName = event.name?.toLowerCase().includes(term);
      const matchDesc = event.description?.toLowerCase().includes(term);
      const matchVenue = event.venue?.toLowerCase().includes(term);
      const matchCategory = event.category?.toLowerCase().includes(term);
      return matchName || matchDesc || matchVenue || matchCategory;
    });
  }, [myEvents, searchTerm]);

  const [feedbackQuestions, setFeedbackQuestions] = useState([]);
  const [feedbackAnswers, setFeedbackAnswers] = useState({});
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  // Open Certificate for specific event
  const handleCertificate = (event) => {
    const evId = event.id || event._id;
    const cert = getStudentCertificateForEvent(student.id, evId);
    if (cert) {
      setSelectedCertificate({
        ...cert,
        eventName: event.name,
      });
    }
  };

  // Open QR Token Modal
  const handleViewQR = (event) => {
    setSelectedQREvent(event);
  };

  // Open Feedback Modal for specific event
  const handleFeedback = (event) => {
    setSelectedFeedbackEvent(event);
    const evId = event.id || event._id;
    const alreadyDone = hasSubmittedFeedback(student.id, evId);
    setFeedbackSubmitted(alreadyDone);
    setFeedbackError("");

    const formConfig = getEventFeedbackForm(evId);
    const qs = formConfig?.questions || [];
    setFeedbackQuestions(qs);

    const initialAnswers = {};
    qs.forEach((q) => {
      initialAnswers[q.id] = q.type === "checkbox" ? [] : "";
    });
    setFeedbackAnswers(initialAnswers);

    // Fetch live backend form questions & submission status asynchronously
    fetchEventFeedbackForm(evId)
      .then((liveForm) => {
        if (liveForm) {
          if (liveForm.hasSubmitted) {
            setFeedbackSubmitted(true);
          }
          if (Array.isArray(liveForm.questions) && liveForm.questions.length > 0) {
            setFeedbackQuestions(liveForm.questions);
            const liveAnswers = {};
            liveForm.questions.forEach((q) => {
              liveAnswers[q.id] = q.type === "checkbox" ? [] : "";
            });
            setFeedbackAnswers((prev) => ({ ...liveAnswers, ...prev }));
          }
        }
      })
      .catch(() => {});
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();

    if (feedbackQuestions.length === 0) {
      setFeedbackError("No feedback questions configured for this event.");
      return;
    }

    // Validate that all questions have responses
    for (const q of feedbackQuestions) {
      const val = feedbackAnswers[q.id];
      if (q.type === "checkbox") {
        if (!val || val.length === 0) {
          setFeedbackError(`Please select at least one option for: "${q.question}"`);
          return;
        }
      } else {
        if (!val || (typeof val === "string" && !val.trim())) {
          setFeedbackError(`Please answer: "${q.question}"`);
          return;
        }
      }
    }

    const evId = selectedFeedbackEvent.id || selectedFeedbackEvent._id;
    try {
      await submitStudentFeedback(student.id, evId, feedbackAnswers);
      setFeedbackError("");
      setFeedbackSubmitted(true);
      fetchStudentCertificates(student.id).catch(() => {});
    } catch (err) {
      setFeedbackError(err.message || "Failed to submit feedback.");
    }
  };

  const closeFeedback = () => {
    setSelectedFeedbackEvent(null);
    setFeedbackSubmitted(false);
    setFeedbackError("");
    setFeedbackQuestions([]);
    setFeedbackAnswers({});
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* ==================================================== */}
        {/* 1. HEADER SECTION (Matches Volunteer Layout)        */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              My Events
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              View your registrations, attendance QR, feedback, and earned certificates.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search my events..."
              className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* 2. EVENTS DISPLAY (Clean Cards Only)                 */}
        {/* ==================================================== */}
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <AlertCircle size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              No events found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? `No events match "${searchTerm}". Try a different keyword.`
                : "Your registered and attended events will appear here once you register."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const evId = event.id || event._id;
              const attRecord = getStudentAttendanceForEvent(student.id, evId);
              const attendanceStatus = attRecord ? attRecord.status : "pending";
              const cert = getStudentCertificateForEvent(student.id, evId);
              const isPresent = attendanceStatus === "present";
              const feedbackDone = hasSubmittedFeedback(student.id, evId);

              return (
                <div
                  key={event.id || event.registrationId}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md"
                >
                  {/* Event Poster / Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-purple-900 to-indigo-950">
                    {event.poster ? (
                      <img
                        src={event.poster}
                        alt={event.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-[#7040d0] transition-colors">
                      {event.name}
                    </h3>

                    <p className="mt-2 flex-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata Items */}
                    <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#7040d0] shrink-0" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#7040d0] shrink-0" />
                        <span>
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#7040d0] shrink-0" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    </div>

                    {/* Attendance Status */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-medium">Attendance:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          attendanceStatus === "present"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : attendanceStatus === "absent"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {attendanceStatus === "present"
                          ? "Present ✓"
                          : attendanceStatus === "absent"
                          ? "Absent"
                          : "Pending Scan"}
                      </span>
                    </div>

                    {/* Footer Actions (No Registered/Deadline, Keep View Details, Add Show QR, Certificate, Feedback) */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleViewQR(event)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <QrCode size={13} className="shrink-0" />
                          <span>Show QR</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCertificate(event)}
                          disabled={!isPresent || !cert}
                          className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                          title={
                            !isPresent
                              ? "Certificate is available after attendance is verified."
                              : !cert
                              ? "Certificate is being prepared."
                              : "View Certificate"
                          }
                        >
                          <Award size={13} className="shrink-0" />
                          <span>Certificate</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFeedback(event)}
                          disabled={!isPresent && event.status === "upcoming"}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                          title={
                            !isPresent && event.status === "upcoming"
                              ? "Feedback will open once event commences."
                              : "Submit event feedback"
                          }
                        >
                          <MessageSquare size={13} className="shrink-0" />
                          <span>{feedbackDone ? "Feedback ✓" : "Feedback"}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EVENT DETAILS MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl sm:max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* TOP SECTION: Event Poster Banner with Floating Title & Close */}
            <div className="relative w-full h-52 sm:h-64 md:h-72 bg-gradient-to-br from-[#211653] to-[#432371] shrink-0 overflow-hidden">
              {selectedEvent.poster ? (
                <img
                  src={selectedEvent.poster}
                  alt={selectedEvent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : null}

              {/* Gradient Overlay for visual hierarchy and readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/35 pointer-events-none" />

              {/* Floating Close Button */}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-all shadow-md"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>

              {/* Floating Header Info on Poster */}
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#7040d0] text-white shadow-xs">
                    {selectedEvent.category || "General Event"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/80 backdrop-blur-md text-white border border-emerald-400/40">
                    Registered ✓
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-tight drop-shadow-sm text-white">
                  {selectedEvent.name}
                </h2>
              </div>
            </div>

            {/* MODAL SCROLLABLE BODY */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              {/* Schedule and Location Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 text-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7040d0]">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Date</span>
                    <span className="font-semibold text-gray-800 text-[11px]">
                      {formatDate(selectedEvent.eventDate)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7040d0]">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Timing</span>
                    <span className="font-semibold text-gray-800 text-[11px]">
                      {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7040d0]">
                    <MapPin size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Venue</span>
                    <span className="font-semibold text-gray-800 text-[11px] truncate block">
                      {selectedEvent.venue || "Venue TBA"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[#7040d0]">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block">Speaker</span>
                    <span className="font-semibold text-gray-800 text-[11px] truncate block">
                      {selectedEvent.speakerName || "TCF Team"}
                    </span>
                  </div>
                </div>
              </div>

              {/* About the Event */}
              <div>
                <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1.5">
                  About the Event
                </h4>
                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-line">
                  {selectedEvent.description || "No specific description provided."}
                </p>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {(selectedEvent.rulebook ||
                  selectedEvent.ruleBook ||
                  selectedEvent.rulebookUrl ||
                  selectedEvent.guidelinesUrl) && (
                  <button
                    type="button"
                    onClick={() => {
                      const url =
                        selectedEvent.rulebook ||
                        selectedEvent.ruleBook ||
                        selectedEvent.rulebookUrl ||
                        selectedEvent.guidelinesUrl;
                      window.open(url, "_blank");
                    }}
                    className="px-3.5 py-2 border border-[#7040d0]/30 bg-purple-50 text-[#7040d0] hover:bg-purple-100 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FileText size={14} />
                    <span>View Rulebook</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const ev = selectedEvent;
                    setSelectedEvent(null);
                    handleViewQR(ev);
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <QrCode size={14} />
                  <span>Show QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR ATTENDANCE MODAL */}
      {selectedQREvent && (
        <div
          className="feedback-modal-overlay"
          onClick={() => setSelectedQREvent(null)}
          style={{ zIndex: 9999 }}
        >
          <div
            className="feedback-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: "center", maxWidth: "440px" }}
          >
            <button
              type="button"
              className="feedback-close"
              onClick={() => setSelectedQREvent(null)}
              aria-label="Close"
            >
              ×
            </button>

            <h2
              className="text-xl font-bold text-gray-900 tracking-tight"
              style={{ fontWeight: "700", color: "#111827", fontSize: "20px", marginBottom: "6px" }}
            >
              Event Attendance QR
            </h2>
            <p
              className="text-sm font-bold text-gray-800"
              style={{ fontWeight: "700", color: "#374151", fontSize: "15px", marginBottom: "20px" }}
            >
              {selectedQREvent.name}
            </p>

            <div
              style={{
                width: "180px",
                height: "180px",
                margin: "0 auto 20px",
                padding: "16px",
                background: "#f8fafc",
                borderRadius: "16px",
                border: "2px dashed #6a3bc5",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: "64px", color: "#6a3bc5", lineHeight: 1 }}>▦</div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#4f46e5",
                  marginTop: "8px",
                }}
              >
                {selectedQREvent.qrCode || `QR-${selectedQREvent.id}-${student.id}`}
              </span>
            </div>

            <p style={{ fontSize: "12px", color: "#777", margin: 0 }}>
              Show this QR code to the Volunteer at the event venue to mark your attendance.
            </p>
          </div>
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <CertificateView
          certificate={selectedCertificate}
          studentName={student.fullName}
          enrollmentNo={student.enrollmentNo || "220130107054"}
          eventName={selectedCertificate.eventName}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* FEEDBACK MODAL */}
      {selectedFeedbackEvent && (
        <div className="feedback-modal-overlay" onClick={closeFeedback}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="feedback-close"
              onClick={closeFeedback}
              aria-label="Close"
            >
              ×
            </button>

            {!feedbackSubmitted ? (
              <>
                <div className="feedback-modal-header mb-5 border-b pb-3 text-left">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Event Feedback</h2>
                  <p className="text-sm font-semibold text-[#7040d0] mt-0.5">{selectedFeedbackEvent.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Please answer the questions below as configured by the event coordinator.</p>
                </div>

                {feedbackQuestions.length === 0 ? (
                  <div className="py-8 text-center">
                    <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                    <h3 className="font-bold text-gray-800 text-sm">No Questions Uploaded Yet</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                      The volunteer team has not uploaded feedback questions for this event yet. Please check back later.
                    </p>
                    <button
                      type="button"
                      onClick={closeFeedback}
                      className="mt-5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-left">
                    {feedbackQuestions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80">
                        <label className="block text-xs font-bold text-gray-800 mb-2">
                          <span className="text-[#7040d0] font-black mr-1">{idx + 1}.</span>
                          {q.question}
                          <span className="text-red-500 ml-1">*</span>
                        </label>

                        {/* Radio (Single Choice) */}
                        {q.type === "radio" && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt, oIdx) => (
                              <label
                                key={oIdx}
                                className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                  feedbackAnswers[q.id] === opt
                                    ? "bg-purple-50 border-[#7040d0] text-purple-900 font-semibold"
                                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.id}
                                  value={opt}
                                  checked={feedbackAnswers[q.id] === opt}
                                  onChange={() =>
                                    setFeedbackAnswers((prev) => ({ ...prev, [q.id]: opt }))
                                  }
                                  className="text-[#7040d0] focus:ring-[#7040d0]"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Checkbox (Multi Choice) */}
                        {q.type === "checkbox" && (
                          <div className="space-y-2 mt-2">
                            {q.options?.map((opt, oIdx) => {
                              const currentList = Array.isArray(feedbackAnswers[q.id])
                                ? feedbackAnswers[q.id]
                                : [];
                              const isChecked = currentList.includes(opt);
                              return (
                                <label
                                  key={oIdx}
                                  className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-purple-50 border-[#7040d0] text-purple-900 font-semibold"
                                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    value={opt}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const updated = e.target.checked
                                        ? [...currentList, opt]
                                        : currentList.filter((item) => item !== opt);
                                      setFeedbackAnswers((prev) => ({ ...prev, [q.id]: updated }));
                                    }}
                                    className="rounded text-[#7040d0] focus:ring-[#7040d0]"
                                  />
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {/* Textarea (Written) */}
                        {q.type === "textarea" && (
                          <textarea
                            rows={3}
                            value={feedbackAnswers[q.id] || ""}
                            onChange={(e) =>
                              setFeedbackAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                            }
                            placeholder="Enter your detailed response here..."
                            className="w-full text-xs p-3 rounded-lg border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-1 focus:ring-[#7040d0]"
                          />
                        )}

                        {/* Rating (1-5 Star) */}
                        {q.type === "rating" && (
                          <div className="flex items-center gap-2 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                type="button"
                                key={star}
                                onClick={() =>
                                  setFeedbackAnswers((prev) => ({ ...prev, [q.id]: star }))
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                  Number(feedbackAnswers[q.id]) === star
                                    ? "bg-[#7040d0] text-white border-[#7040d0]"
                                    : "bg-white text-gray-700 border-gray-200 hover:bg-purple-50"
                                }`}
                              >
                                {star} ★
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {feedbackError && (
                      <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                        {feedbackError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={closeFeedback}
                        className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="feedback-success py-6 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3">
                  ✓
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Feedback Submitted!</h2>
                <p className="text-xs text-gray-500 mb-5">
                  Thank you for sharing your experience. Your responses have been submitted to the event organizers.
                </p>
                <button
                  type="button"
                  onClick={closeFeedback}
                  className="px-6 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
}

export default MyEvents;