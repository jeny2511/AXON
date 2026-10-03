import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  X,
  User,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";

import { events as initialMockEvents } from "../../mockData";
import api from "../../services/api";

// Format date helper (e.g. "23 Oct 2027")
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const dateObj = new Date(`${dateStr}`.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Format time helper (e.g. "10:00 AM")
function formatTime(timeStr) {
  if (!timeStr) return "";
  if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
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

// Calculate Event Status: "upcoming" | "ongoing" | "past"
function getEventStatus(event) {
  if (!event) return "upcoming";
  const now = new Date();
  const start = new Date(
    `${event.eventDate || event.date || ""}`.includes("T")
      ? (event.eventDate || event.date)
      : `${event.eventDate || event.date || ""}T${event.startTime || "09:00"}`
  );
  const end = new Date(
    `${event.eventDate || event.endDate || event.date || ""}`.includes("T")
      ? (event.eventDate || event.endDate || event.date)
      : `${event.eventDate || event.endDate || event.date || ""}T${event.endTime || "17:00"}`
  );

  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "past";
}

// Calculate Registration Status: "opened" | "not opened" | "closed"
function getRegistrationStatus(event) {
  if (!event) return "closed";
  const now = new Date();
  const eventStatus = getEventStatus(event);

  if (eventStatus === "past") return "closed";

  if (event.registrationStatus) {
    const raw = event.registrationStatus.toLowerCase();
    if (raw === "open" || raw === "opened") return "opened";
    if (raw === "closed") return "closed";
    if (raw === "not opened" || raw === "not_opened" || raw === "upcoming") return "not opened";
  }

  if (event.registrationOpen && event.registrationClose) {
    const openDate = new Date(event.registrationOpen);
    const closeDate = new Date(event.registrationClose);
    if (now < openDate) return "not opened";
    if (now > closeDate) return "closed";
    return "opened";
  }

  if (event.registrationClose) {
    const closeDate = new Date(event.registrationClose);
    if (now > closeDate) return "closed";
    return "opened";
  }

  const limit = event.participantLimit || event.seats;
  if (limit && (event.registeredCount || 0) >= limit) {
    return "closed";
  }

  return eventStatus === "upcoming" || eventStatus === "ongoing" ? "opened" : "closed";
}

// Standard combination departments as configured in the volunteer & student modules
const COMBINATION_DEPTS = ["IT", "CS", "CE", "ICT", "EC"];

// Resolves allowed Year & Department combinations matching Student/Volunteer module
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
      typeof yr === "string"
        ? yr
        : yr === 1
        ? "1st Year"
        : yr === 2
        ? "2nd Year"
        : yr === 3
        ? "3rd Year"
        : yr === 4
        ? "4th Year"
        : `Year ${yr}`;
    return deptList.map((d) => `${yrLabel} ${d}`);
  });
}

function Events() {
  const [eventsList, setEventsList] = useState(() => {
    try {
      const saved = localStorage.getItem("axon_live_events");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialMockEvents;
  });

  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rulebookModalEvent, setRulebookModalEvent] = useState(null);

  // Fetch live events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const list = res?.events || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list)) {
          const normalized = list.map((ev) => ({
            ...ev,
            id: ev._id || ev.id,
            _id: ev._id || ev.id,
            name: ev.name || ev.title,
            category: ev.category || "Technical Workshop",
            eventDate: ev.date ? ev.date.split("T")[0] : ev.eventDate,
            date: ev.date ? ev.date.split("T")[0] : ev.eventDate,
            startTime: ev.startTime || "10:00 AM",
            endTime: ev.endTime || "01:00 PM",
            venue: ev.venue || "Campus Auditorium",
            status: ev.status || "upcoming",
            poster: ev.poster || null,
          }));
          setEventsList(normalized);
          try {
            localStorage.setItem("axon_live_events", JSON.stringify(normalized));
          } catch {}
        }
      } catch {
        // Fallback to localStorage or mock
      }
    };
    fetchEvents();

    const handleEventsChange = () => {
      try {
        const saved = localStorage.getItem("axon_live_events");
        if (saved) setEventsList(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("axon-events-change", handleEventsChange);
    return () => window.removeEventListener("axon-events-change", handleEventsChange);
  }, []);

  // Filter events based on search input
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return eventsList;
    const q = search.trim().toLowerCase();
    return eventsList.filter(
      (ev) =>
        ev.name?.toLowerCase().includes(q) ||
        ev.category?.toLowerCase().includes(q) ||
        ev.venue?.toLowerCase().includes(q) ||
        ev.speaker?.toLowerCase().includes(q) ||
        ev.speakerName?.toLowerCase().includes(q) ||
        ev.description?.toLowerCase().includes(q)
    );
  }, [eventsList, search]);

  // Handler to open Rulebook reliably
  const handleOpenRulebook = (event) => {
    if (!event || !event.rulebook) return;

    const rulebookData = event.rulebook;

    // If it's a web URL starting with http
    if (typeof rulebookData === "string" && (rulebookData.startsWith("http://") || rulebookData.startsWith("https://"))) {
      window.open(rulebookData, "_blank", "noopener,noreferrer");
      return;
    }

    // If it's a data URL (e.g. data:application/pdf;base64,...), convert to blob and open
    if (typeof rulebookData === "string" && rulebookData.startsWith("data:")) {
      try {
        const arr = rulebookData.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        return;
      } catch (e) {
        console.error("Failed to open data URL rulebook:", e);
      }
    }

    // Otherwise open in dedicated in-app Rulebook Modal Viewer
    setRulebookModalEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. HEADER SECTION (Volunteer Style)                 */}
      {/* ==================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#24154f]">
            Events
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and monitor all scheduled and past campus events.
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-8 text-xs outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 shadow-xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. EVENTS DISPLAY (Student Card Design)              */}
      {/* ==================================================== */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <AlertCircle size={32} className="mx-auto text-gray-300" />
          <p className="mt-2 text-sm font-semibold text-gray-700">
            No events found
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {search
              ? `No events match "${search}". Try a different search keyword.`
              : "There are currently no events to display."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const status = getEventStatus(event);
            return (
              <div
                key={event.id || event._id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all hover:shadow-md"
              >
                {/* Event Poster / Cover */}
                <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#211653] to-[#432371]">
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

                  {/* Status Badge */}
                  <span className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white capitalize shadow-xs">
                    {status}
                  </span>

                  {/* Category Badge */}
                  {event.category && (
                    <span className="absolute top-3 left-3 rounded-full bg-[#7040d0]/90 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium text-white shadow-xs">
                      {event.category}
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-bold text-gray-900 text-base line-clamp-1 group-hover:text-[#7040d0] transition-colors">
                    {event.name}
                  </h3>

                  <p className="mt-2 flex-1 text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    {event.description || "No description provided for this event."}
                  </p>

                  {/* Metadata Items */}
                  <div className="mt-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-[#7040d0] shrink-0" />
                      <span>{formatDate(event.eventDate || event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#7040d0] shrink-0" />
                      <span>
                        {formatTime(event.startTime)}
                        {event.endTime ? ` - ${formatTime(event.endTime)}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#7040d0] shrink-0" />
                      <span className="truncate">{event.venue || "Campus Venue"}</span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs gap-3">
                    <div className="text-gray-500 min-w-0">
                      <span>
                        Registered:{" "}
                        <strong className="text-gray-800">
                          {event.registeredCount || 0} /{" "}
                          {event.participantLimit || event.seats || 100}
                        </strong>
                      </span>
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

      {/* ==================================================== */}
      {/* 3. EVENT DETAILS MODAL                               */}
      {/* ==================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl sm:max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* TOP SECTION: Event Poster Banner */}
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

              {/* Gradient Overlay */}
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
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/20 backdrop-blur-md text-white border border-white/20 capitalize">
                    {getEventStatus(selectedEvent)}
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
                      {formatDate(selectedEvent.eventDate || selectedEvent.date)}
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
                      {formatTime(selectedEvent.startTime)}
                      {selectedEvent.endTime ? ` - ${formatTime(selectedEvent.endTime)}` : ""}
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
                      {selectedEvent.venue || "Campus Venue"}
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
                      {selectedEvent.speaker || selectedEvent.speakerName || "TCF Team"}
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
                  {selectedEvent.description || "No description provided for this event."}
                </p>
              </div>

              {/* 3 Status Cards: Capacity & Enrolled | Event Status | Registration Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Capacity & Enrolled */}
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-0.5">Capacity & Enrolled</p>
                  <p className="text-base font-bold text-gray-900">
                    {selectedEvent.registeredCount || 0} /{" "}
                    {selectedEvent.participantLimit || selectedEvent.seats || 100} Registered
                  </p>
                </div>

                {/* 2. Event Status (upcoming, ongoing, past) */}
                {(() => {
                  const evStatus = getEventStatus(selectedEvent);
                  const statusColors = {
                    upcoming: "bg-blue-50 border-blue-200 text-blue-800",
                    ongoing: "bg-emerald-50 border-emerald-200 text-emerald-800",
                    past: "bg-gray-100 border-gray-200 text-gray-700",
                  };
                  return (
                    <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100">
                      <p className="font-semibold text-blue-900 mb-0.5">Event Status</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold capitalize border ${statusColors[evStatus] || "bg-gray-100 text-gray-700"}`}>
                          {evStatus}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Registration Status (opened, not opened, closed) */}
                {(() => {
                  const regStatus = getRegistrationStatus(selectedEvent);
                  const regColors = {
                    opened: {
                      bg: "bg-green-50/70 border-green-100 text-green-900",
                      badge: "bg-green-100 text-green-800 border-green-200",
                      icon: CheckCircle2,
                    },
                    "not opened": {
                      bg: "bg-amber-50/70 border-amber-100 text-amber-900",
                      badge: "bg-amber-100 text-amber-800 border-amber-200",
                      icon: Clock3,
                    },
                    closed: {
                      bg: "bg-rose-50/70 border-rose-100 text-rose-900",
                      badge: "bg-rose-100 text-rose-800 border-rose-200",
                      icon: XCircle,
                    },
                  };
                  const cfg = regColors[regStatus] || regColors.closed;
                  const Icon = cfg.icon;

                  return (
                    <div className={`p-3.5 rounded-xl border ${cfg.bg}`}>
                      <p className="font-semibold mb-0.5">Registration Status</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold capitalize border flex items-center gap-1 ${cfg.badge}`}>
                          <Icon size={13} />
                          {regStatus}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ==================================================== */}
              {/* ELIGIBILITY CRITERIA & CONDITIONS (Student Module UI) */}
              {/* ==================================================== */}
              {(() => {
                const eventCombinations = getEventCombinations(selectedEvent);
                return (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                        Eligibility Criteria & Conditions
                      </h4>
                      <span className="text-[11px] text-gray-500 font-medium">
                        {eventCombinations.length} Allowed Combination{eventCombinations.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Combinations Chips Display */}
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-gray-200">
                      {eventCombinations.length > 0 ? (
                        eventCombinations.map((combo) => (
                          <span
                            key={combo}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold border flex items-center gap-1 bg-purple-50 text-[#7040d0] border-purple-200"
                          >
                            <span>✓</span>
                            <span>{combo}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic p-1">
                          Open to all students across all years and departments
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Rulebook Document */}
              {selectedEvent.rulebook && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText size={18} className="text-amber-700 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-amber-900 truncate">Event Rulebook</p>
                      <p className="text-[11px] text-amber-700 truncate">
                        {typeof selectedEvent.rulebook === "string" && !selectedEvent.rulebook.startsWith("data:")
                          ? selectedEvent.rulebook
                          : "Review guidelines, rules and evaluation criteria."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenRulebook(selectedEvent)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>View Rulebook</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. DEDICATED IN-APP RULEBOOK VIEWER MODAL            */}
      {/* ==================================================== */}
      {rulebookModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#211653] text-white">
              <div className="flex items-center gap-2.5">
                <BookOpen size={20} className="text-purple-300" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Event Rulebook & Guidelines
                  </h3>
                  <p className="text-[11px] text-purple-200">
                    {rulebookModalEvent.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRulebookModalEvent(null)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6 space-y-4 text-xs text-gray-700">
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex items-start gap-3">
                <FileText size={24} className="text-[#7040d0] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-[#24154f]">
                    {typeof rulebookModalEvent.rulebook === "string" && !rulebookModalEvent.rulebook.startsWith("data:")
                      ? rulebookModalEvent.rulebook
                      : `${rulebookModalEvent.name}_Official_Rulebook.pdf`}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Official Guidelines Document • The Cyber Force (TCF)
                  </p>
                </div>
              </div>

              {/* Guidelines Overview */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                  General Rules & Code of Conduct
                </h4>
                <ul className="list-disc pl-5 space-y-1.5 text-gray-600 leading-relaxed">
                  <li>Participants must bring their valid college ID cards to the venue.</li>
                  <li>Arrive at the designated venue at least 15 minutes before the scheduled start time ({rulebookModalEvent.startTime || "10:00 AM"}).</li>
                  <li>Laptops and required development tools should be pre-configured as specified in the event description.</li>
                  <li>Maintain professional decorum and adhere to college campus ethical standards.</li>
                  <li>Attendance QR scan and post-event feedback submission are required for certificate issuance.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
                <p className="font-semibold text-gray-800">Event Venue & Contact</p>
                <p className="text-gray-600">Venue: <strong className="text-gray-800">{rulebookModalEvent.venue || "Campus Venue"}</strong></p>
                <p className="text-gray-600">Lead Speaker: <strong className="text-gray-800">{rulebookModalEvent.speaker || rulebookModalEvent.speakerName || "TCF Team"}</strong></p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-500 font-medium">
                Verified Document
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRulebookModalEvent(null)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-100 transition shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Events;