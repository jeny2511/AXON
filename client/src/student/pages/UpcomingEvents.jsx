import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import {
  getUpcomingEvents,
  fetchEvents,
  getActiveStudentId,
  getStudentProfile,
  isStudentRegistered,
  checkRegistrationEligibility,
  registerStudentForEvent,
  registerStudentForEventAsync,
} from "../services/studentService";
import { filterEventsBySearch } from "../utils/filterEvents";

// Format date into standard display (e.g. "23 Oct 2027")
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}`.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(dateObj)) return dateStr;
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

// Standard combination departments as configured in the volunteer module
const COMBINATION_DEPTS = ["IT", "CS", "CE", "ICT", "EC"];

// Resolves allowed Year & Department combinations matching Volunteer module
function getEventCombinations(event) {
  if (!event) return [];
  if (event.eligibleCombinations && event.eligibleCombinations.length > 0) {
    return event.eligibleCombinations;
  }
  const years =
    event.eligibleYears && event.eligibleYears.length > 0
      ? event.eligibleYears
      : [1, 2, 3, 4];
  const depts =
    event.eligibleDepartments && event.eligibleDepartments.length > 0
      ? event.eligibleDepartments
      : ["ALL"];
  const deptList = depts.includes("ALL") ? COMBINATION_DEPTS : depts;

  return years.flatMap((yr) => {
    const yrLabel =
      yr === 1
        ? "1st Year"
        : yr === 2
        ? "2nd Year"
        : yr === 3
        ? "3rd Year"
        : "4th Year";
    return deptList.map((d) => `${yrLabel} ${d}`);
  });
}

function UpcomingEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [hasViewedRulebook, setHasViewedRulebook] = useState(false);

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    department: "IT",
    year: 3,
  };

  const [, setEventTick] = useState(0);

  useEffect(() => {
    fetchEvents().then(() => setEventTick((t) => t + 1)).catch(() => {});
    const handleEventsChange = () => setEventTick((t) => t + 1);
    window.addEventListener("axon-events-change", handleEventsChange);
    return () => window.removeEventListener("axon-events-change", handleEventsChange);
  }, []);

  const allUpcoming = getUpcomingEvents();
  const filteredEvents = filterEventsBySearch(allUpcoming, searchTerm);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setRegistrationMessage("");
    setHasViewedRulebook(false);
  };

  const handleClose = () => {
    setSelectedEvent(null);
    setRegistrationMessage("");
    setHasViewedRulebook(false);
  };

  // Rulebook inspection handler
  const handleOpenRulebook = (url) => {
    if (url) {
      window.open(url, "_blank");
      setHasViewedRulebook(true);
      setRegistrationMessage("");
    }
  };

  // Register with rulebook validation check
  const handleRegisterClick = async (event) => {
    const hasRulebook = Boolean(event.rulebook && event.rulebook.trim() !== "");
    if (hasRulebook && !hasViewedRulebook) {
      setRegistrationMessage(
        "⚠️ Please review the event rulebook before proceeding with registration."
      );
      return;
    }

    const eligibility = checkRegistrationEligibility(event, student);
    if (!eligibility.eligible) {
      setRegistrationMessage(eligibility.reason);
      return;
    }

    try {
      const evId = event.id || event._id;
      await registerStudentForEventAsync(student.id, evId);
      setRegistrationMessage(
        "Registered successfully! Your attendance QR pass is available in My Events."
      );
    } catch (err) {
      registerStudentForEvent(student.id, event.id || event._id);
      setRegistrationMessage(
        "Registered successfully! Your attendance QR pass is available in My Events."
      );
    }
  };

  // Compute allowed combinations for the currently viewed event
  const eventCombinations = useMemo(() => {
    return getEventCombinations(selectedEvent);
  }, [selectedEvent]);

  // Student's own combination badge for comparison
  const studentYearLabel =
    student?.year === 1
      ? "1st Year"
      : student?.year === 2
      ? "2nd Year"
      : student?.year === 3
      ? "3rd Year"
      : "4th Year";
  const studentComboKey = student?.department
    ? `${studentYearLabel} ${student.department}`
    : null;
  const isStudentComboEligible =
    !studentComboKey || eventCombinations.includes(studentComboKey);

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* ==================================================== */}
        {/* 1. HEADER SECTION (Matches Volunteer Layout)        */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Upcoming Events
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Explore, register, and prepare for upcoming club events and workshops.
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
              onChange={handleSearchChange}
              placeholder="Search events..."
              className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
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
              No upcoming events found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? `No events match "${searchTerm}". Try a different keyword.`
                : "There are currently no upcoming events scheduled."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
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

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-gray-500 min-w-0">
                      <span>
                        Registered:{" "}
                        <strong className="text-gray-800">
                          {event.registeredCount || 0} /{" "}
                          {event.participantLimit || 100}
                        </strong>
                      </span>

                      {event.registrationClose && (
                        <span>
                          Registration Deadline:{" "}
                          <strong className="text-gray-800">
                            {formatDate(event.registrationClose)}
                          </strong>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleViewEvent(event)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================== */}
        {/* 3. EVENT DETAILS MODAL (Prominent Poster & Bigger)  */}
        {/* ==================================================== */}
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
                  onClick={handleClose}
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
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20">
                      {isStudentRegistered(student.id, selectedEvent.id)
                        ? "Registered ✓"
                        : selectedEvent.status}
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

                {/* Description */}
                <div>
                  <p className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-1.5">
                    Event Description
                  </p>
                  <p className="text-gray-600 leading-relaxed bg-white border border-gray-200 p-3.5 rounded-xl text-xs">
                    {selectedEvent.description || "No description provided."}
                  </p>
                </div>

                {/* Capacity and Registration Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="font-semibold text-purple-900 mb-0.5">Capacity & Enrolled</p>
                    <p className="text-base font-bold text-gray-900">
                      {selectedEvent.registeredCount || 0} /{" "}
                      {selectedEvent.participantLimit || 100} Registered
                    </p>
                  </div>
                  <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-blue-900 mb-0.5">Event Status</p>
                    <p className="text-base font-bold text-blue-800 capitalize">
                      {isStudentRegistered(student.id, selectedEvent.id)
                        ? "Registered ✓"
                        : selectedEvent.status}
                    </p>
                  </div>
                </div>

                {/* ==================================================== */}
                {/* ELIGIBILITY CRITERIA & CONDITIONS                    */}
                {/* ==================================================== */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                      Eligibility Criteria & Conditions
                    </h4>
                    {studentComboKey && (
                      <span
                        className={`text-[11px] font-semibold ${
                          isStudentComboEligible ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        Your Profile: {studentComboKey} (
                        {isStudentComboEligible ? "Eligible ✓" : "Restricted ✕"}
                        )
                      </span>
                    )}
                  </div>

                  {/* Combinations Chips Display */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                    {eventCombinations.map((combo) => {
                      const isMyCombo = combo === studentComboKey;
                      return (
                        <span
                          key={combo}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1 transition-all ${
                            isMyCombo
                              ? "bg-[#7040d0] text-white border-[#7040d0] shadow-xs"
                              : "bg-purple-50 text-[#7040d0] border-purple-200"
                          }`}
                        >
                          <span>✓</span>
                          <span>{combo}</span>
                          {isMyCombo && (
                            <span className="text-[9px] bg-white/25 px-1 rounded ml-0.5 font-bold">
                              You
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Registration Alert Message */}
                {registrationMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      registrationMessage.includes("successfully")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {registrationMessage}
                  </div>
                )}
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-end gap-2.5 px-6 py-4 bg-gray-50/70">
                {/* Rulebook Button: ONLY shown if rulebook is uploaded */}
                {Boolean(selectedEvent.rulebook && selectedEvent.rulebook.trim() !== "") && (
                  <button
                    type="button"
                    onClick={() => handleOpenRulebook(selectedEvent.rulebook)}
                    className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      hasViewedRulebook
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <FileText size={14} />
                    <span>{hasViewedRulebook ? "Rulebook Reviewed ✓" : "View Rulebook"}</span>
                  </button>
                )}

                {(() => {
                  const alreadyRegistered = isStudentRegistered(
                    student.id,
                    selectedEvent.id
                  );
                  const eligibility = checkRegistrationEligibility(
                    selectedEvent,
                    student
                  );

                  if (alreadyRegistered) {
                    return (
                      <button
                        type="button"
                        className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-default flex items-center gap-1.5"
                        disabled
                      >
                        <CheckCircle2 size={14} />
                        <span>Already Registered</span>
                      </button>
                    );
                  }

                  if (!eligibility.eligible) {
                    return (
                      <button
                        type="button"
                        className="px-5 py-2 bg-gray-200 text-gray-500 rounded-lg text-xs font-semibold cursor-not-allowed"
                        disabled
                        title={eligibility.reason}
                      >
                        {eligibility.reason.includes("full")
                          ? "Registration Full"
                          : eligibility.reason.includes("deadline") ||
                            eligibility.reason.includes("closed")
                          ? "Registration Closed"
                          : "Not Eligible"}
                      </button>
                    );
                  }

                  return (
                    <button
                      type="button"
                      className="px-5 py-2 bg-[#7040d0] hover:bg-[#5b32af] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      onClick={() => handleRegisterClick(selectedEvent)}
                    >
                      Register Now
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default UpcomingEvents;