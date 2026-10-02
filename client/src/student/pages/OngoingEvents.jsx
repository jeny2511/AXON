import { useState, useEffect } from "react";
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
} from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import {
  getOngoingEvents,
  fetchEvents,
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

function OngoingEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [, setEventTick] = useState(0);

  useEffect(() => {
    fetchEvents().then(() => setEventTick((t) => t + 1)).catch(() => {});
    const handleChange = () => setEventTick((t) => t + 1);
    window.addEventListener("axon-events-change", handleChange);
    return () => window.removeEventListener("axon-events-change", handleChange);
  }, []);

  const allOngoing = getOngoingEvents();
  const filteredEvents = filterEventsBySearch(allOngoing, searchTerm);

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
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* ==================================================== */}
        {/* 1. HEADER SECTION                                    */}
        {/* ==================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Ongoing Events
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Participate in events and workshops that are currently live and active.
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
              placeholder="Search ongoing events..."
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
        {/* 2. ONGOING EVENTS GRID                               */}
        {/* ==================================================== */}
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <AlertCircle size={32} className="mx-auto text-gray-300" />
            <p className="mt-2 text-sm font-semibold text-gray-700">
              No ongoing events found
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {searchTerm
                ? `No ongoing events match "${searchTerm}". Try a different keyword.`
                : "There are currently no ongoing events active at the moment."}
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

                  {/* Footer Action */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end text-xs">
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
                      {selectedEvent.category || "Live Event"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/85 backdrop-blur-md text-white border border-emerald-400/40">
                      Ongoing • Live
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

                {/* Event Description */}
                <div>
                  <h4 className="font-bold text-xs text-gray-900 uppercase tracking-wider mb-1.5">
                    About the Event
                  </h4>
                  <p className="text-gray-600 leading-relaxed bg-white border border-gray-200 p-3.5 rounded-xl text-xs whitespace-pre-line">
                    {selectedEvent.description || "No description provided."}
                  </p>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClose}
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default OngoingEvents;