import { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  UserCheck,
  UserX,
  Search,
  X,
  Download,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { events as initialMockEvents, users } from "../../mockData";

// Format date helper
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

// Format time helper
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

// Helper to format year nicely
function formatYearLabel(yearVal) {
  if (!yearVal) return "1st Year";
  const num = Number(yearVal);
  if (num === 1) return "1st Year";
  if (num === 2) return "2nd Year";
  if (num === 3) return "3rd Year";
  if (num === 4) return "4th Year";
  return String(yearVal).includes("Year") ? yearVal : `${yearVal}th Year`;
}

function Attendance() {
  // Load live events (or fallback to mock events)
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

  // Load volunteers (mock + custom created)
  const [volunteers, setVolunteers] = useState([]);

  const loadVolunteersList = () => {
    const mockVolunteers = users
      .filter((user) => user.role === "volunteer")
      .map((u) => ({
        ...u,
        enrollmentNumber: u.enrollmentNumber || u.enrollmentNo || "",
        phoneNumber: u.phoneNumber || u.phone || "",
        committeePosition: u.committeePosition || u.committee || "Volunteer Member",
        year: u.year || u.academicYear || 1,
      }));

    const addedVolunteers =
      JSON.parse(localStorage.getItem("axonVolunteers")) || [];

    const map = new Map();
    [...mockVolunteers, ...addedVolunteers].forEach((vol) => {
      const key = vol.id || vol._id || vol.enrollmentNumber || vol.enrollmentNo;
      if (key) {
        map.set(key, {
          ...vol,
          id: vol.id || vol._id || key,
          enrollmentNumber: vol.enrollmentNumber || vol.enrollmentNo || "",
          committeePosition:
            vol.committeePosition || vol.committee || "Volunteer Member",
          year: vol.year || vol.academicYear || 1,
        });
      }
    });

    setVolunteers(Array.from(map.values()));
  };

  useEffect(() => {
    loadVolunteersList();
    const handleSync = () => loadVolunteersList();
    window.addEventListener("axon-volunteers-change", handleSync);
    return () => window.removeEventListener("axon-volunteers-change", handleSync);
  }, []);

  // Selected Event & Navigation State
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Search queries
  const [eventSearch, setEventSearch] = useState("");
  const [volunteerSearch, setVolunteerSearch] = useState("");

  // Attendance storage: { [eventId]: { [volunteerId]: "Present" | "Absent" } }
  const [attendanceRecords, setAttendanceRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("axon_volunteer_attendance");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      EV001: {
        VL001: "Present",
        VL002: "Present",
        VL003: "Absent",
      },
    };
  });

  const [submittedEvents, setSubmittedEvents] = useState(() => {
    try {
      const saved = localStorage.getItem("axon_volunteer_attendance_submitted");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { EV001: true };
  });

  const [notification, setNotification] = useState(null);

  // Sync state to local storage
  const saveAttendanceData = (newRecords, newSubmitted) => {
    setAttendanceRecords(newRecords);
    try {
      localStorage.setItem("axon_volunteer_attendance", JSON.stringify(newRecords));
      if (newSubmitted) {
        localStorage.setItem(
          "axon_volunteer_attendance_submitted",
          JSON.stringify(newSubmitted)
        );
      }
    } catch {}
  };

  // Get current event attendance dictionary
  const currentEventAttendance = useMemo(() => {
    if (!selectedEvent) return {};
    const eventKey = selectedEvent.id || selectedEvent._id;
    return attendanceRecords[eventKey] || {};
  }, [selectedEvent, attendanceRecords]);

  // Calculate statistics for an event
  const getEventStats = (event) => {
    if (!event) return { present: 0, absent: 0, total: 0, percentage: 0 };
    const eventKey = event.id || event._id;
    const eventData = attendanceRecords[eventKey] || {};

    let present = 0;
    let absent = 0;

    volunteers.forEach((v) => {
      const vKey = v.id || v._id || v.enrollmentNumber;
      const status = eventData[vKey];
      if (status === "Present") present++;
      else if (status === "Absent") absent++;
    });

    const total = volunteers.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, total, percentage };
  };

  // Mark single volunteer attendance
  const handleMark = (volunteerKey, status) => {
    if (!selectedEvent) return;
    const eventKey = selectedEvent.id || selectedEvent._id;
    const newRecords = {
      ...attendanceRecords,
      [eventKey]: {
        ...(attendanceRecords[eventKey] || {}),
        [volunteerKey]: status,
      },
    };
    saveAttendanceData(newRecords);
  };

  // Mark all volunteers Present
  const handleMarkAllPresent = () => {
    if (!selectedEvent) return;
    const eventKey = selectedEvent.id || selectedEvent._id;
    const allPresent = {};
    volunteers.forEach((v) => {
      const vKey = v.id || v._id || v.enrollmentNumber;
      allPresent[vKey] = "Present";
    });

    const newRecords = {
      ...attendanceRecords,
      [eventKey]: allPresent,
    };
    saveAttendanceData(newRecords);

    setNotification({
      type: "success",
      message: "All volunteers marked as Present.",
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Submit / Save Attendance
  const handleSubmitAttendance = () => {
    if (!selectedEvent) return;
    const eventKey = selectedEvent.id || selectedEvent._id;

    const newSubmitted = {
      ...submittedEvents,
      [eventKey]: true,
    };
    setSubmittedEvents(newSubmitted);
    saveAttendanceData(attendanceRecords, newSubmitted);

    setNotification({
      type: "success",
      message: `Volunteer attendance for "${selectedEvent.name}" saved successfully!`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  // Export Attendance CSV
  const handleExportCSV = () => {
    if (!selectedEvent) return;
    const eventKey = selectedEvent.id || selectedEvent._id;
    const eventData = attendanceRecords[eventKey] || {};

    let csv = "Volunteer Name,Enrollment Number,Department,Year,Committee Position,Attendance Status\n";

    volunteers.forEach((v) => {
      const vKey = v.id || v._id || v.enrollmentNumber;
      const status = eventData[vKey] || "Unmarked";
      csv += `"${v.fullName || ""}","${v.enrollmentNumber || v.enrollmentNo || ""}","${v.department || ""}","${formatYearLabel(v.year)}","${v.committeePosition || ""}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(selectedEvent.name || "Event").replace(/\s+/g, "_")}_Volunteer_Attendance.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setNotification({
      type: "success",
      message: "Attendance CSV file exported successfully.",
    });
    setTimeout(() => setNotification(null), 3000);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!eventSearch.trim()) return eventsList;
    const q = eventSearch.trim().toLowerCase();
    return eventsList.filter(
      (ev) =>
        ev.name?.toLowerCase().includes(q) ||
        ev.category?.toLowerCase().includes(q) ||
        ev.venue?.toLowerCase().includes(q)
    );
  }, [eventsList, eventSearch]);

  // Filtered Volunteers for Selected Event
  const filteredVolunteers = useMemo(() => {
    if (!volunteerSearch.trim()) return volunteers;
    const q = volunteerSearch.trim().toLowerCase();
    return volunteers.filter(
      (v) =>
        v.fullName?.toLowerCase().includes(q) ||
        v.department?.toLowerCase().includes(q) ||
        v.committeePosition?.toLowerCase().includes(q) ||
        (v.enrollmentNumber || v.enrollmentNo)?.toLowerCase().includes(q)
    );
  }, [volunteers, volunteerSearch]);

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. NOTIFICATION BANNER                               */}
      {/* ==================================================== */}
      {notification && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* ==================================================== */}
      {/* VIEW A: ALL EVENTS LIST (Horizontal Table View)       */}
      {/* ==================================================== */}
      {!selectedEvent ? (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#24154f] tracking-tight">
                  Volunteer Attendance
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#7040d0] border border-purple-200">
                  {eventsList.length} Events
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select an event to view, manage, and verify volunteer presence records
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
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by title, venue..."
                className="w-full h-10 pl-9 pr-8 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition-all shadow-xs"
              />
              {eventSearch && (
                <button
                  type="button"
                  onClick={() => setEventSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Events Horizontal Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Event Name</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Time</th>
                    <th className="py-3.5 px-6">Venue</th>
                    <th className="py-3.5 px-6">Attendance Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle size={28} className="text-gray-300" />
                          <p className="font-semibold text-sm text-gray-700">
                            No events found
                          </p>
                          <p className="text-xs text-gray-400">
                            {eventSearch
                              ? `No events match "${eventSearch}". Try another search keyword.`
                              : "There are currently no events to display."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event) => {
                      const eventKey = event.id || event._id;
                      const stats = getEventStats(event);
                      const isSubmitted = submittedEvents[eventKey];

                      return (
                        <tr
                          key={eventKey}
                          className="hover:bg-purple-50/30 transition-colors"
                        >
                          {/* 1. Event Name */}
                          <td className="py-4 px-6">
                            <div className="font-bold text-gray-900 text-sm">
                              {event.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {event.category || "Campus Event"}
                            </div>
                          </td>

                          {/* 2. Date */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs whitespace-nowrap">
                            {formatDate(event.eventDate || event.date)}
                          </td>

                          {/* 3. Time */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs whitespace-nowrap">
                            {formatTime(event.startTime)}
                            {event.endTime ? ` - ${formatTime(event.endTime)}` : ""}
                          </td>

                          {/* 4. Venue */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                            {event.venue || "Campus Venue"}
                          </td>

                          {/* 5. Attendance Status / Summary */}
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              {stats.present > 0 || stats.absent > 0 ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-xs font-semibold">
                                    <span className="text-emerald-700">
                                      {stats.present} Present
                                    </span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-rose-600">
                                      {stats.absent} Absent
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-[#7040d0] h-full rounded-full"
                                        style={{ width: `${stats.percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {stats.percentage}%
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">
                                  Not Marked Yet
                                </span>
                              )}

                              {isSubmitted && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                                  Saved ✓
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 6. Action */}
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedEvent(event)}
                              className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                            >
                              View Attendance
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Showing <strong>{filteredEvents.length}</strong> of{" "}
                <strong>{eventsList.length}</strong> events
              </span>
            </div>
          </div>
        </>
      ) : (
        /* ==================================================== */
        /* VIEW B: SELECTED EVENT ATTENDANCE DETAIL             */
        /* ==================================================== */
        <div className="space-y-6">
          {/* Top Bar: Back Button (Small) */}
          <div>
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft size={13} />
              <span>Back to Events</span>
            </button>
          </div>

          {/* Event Header Card (Compact & Clean) */}
          <div className="bg-white rounded-xl border border-gray-200 px-4.5 py-3.5 sm:px-5 sm:py-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-[#7040d0] border border-purple-200">
                    {selectedEvent.category || "Campus Event"}
                  </span>
                  {submittedEvents[selectedEvent.id || selectedEvent._id] && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Submitted
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#24154f] leading-snug truncate">
                  {selectedEvent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-[#7040d0]" />
                    {formatDate(selectedEvent.eventDate || selectedEvent.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} className="text-[#7040d0]" />
                    {formatTime(selectedEvent.startTime)}
                    {selectedEvent.endTime ? ` - ${formatTime(selectedEvent.endTime)}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-[#7040d0]" />
                    {selectedEvent.venue || "Campus Venue"}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Compact) */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-semibold text-gray-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck size={13} className="text-emerald-600" />
                  <span>Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[11px] font-semibold text-gray-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} className="text-[#7040d0]" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAttendance}
                  className="px-3.5 py-1.5 rounded-lg bg-[#7040d0] hover:bg-[#5b32af] text-white text-[11px] font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Save Attendance</span>
                </button>
              </div>
            </div>

            {/* 3 Summary Stats Boxes: Total Volunteers, Present, Absent */}
            {(() => {
              const stats = getEventStats(selectedEvent);
              return (
                <div className="grid grid-cols-3 gap-3 pt-3 mt-3 border-t border-gray-100">
                  <div className="px-3.5 py-2.5 bg-gray-50 rounded-lg border border-gray-200/80">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Total Volunteers
                    </span>
                    <span className="text-base font-bold text-gray-900 mt-0.5 block">
                      {stats.total}
                    </span>
                  </div>

                  <div className="px-3.5 py-2.5 bg-emerald-50/70 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Present
                    </span>
                    <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                      {stats.present}
                    </span>
                  </div>

                  <div className="px-3.5 py-2.5 bg-rose-50/70 rounded-lg border border-rose-100">
                    <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                      Absent
                    </span>
                    <span className="text-base font-bold text-rose-700 mt-0.5 block">
                      {stats.absent}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Volunteers List Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#24154f]">
                Volunteer Attendance Sheet
              </h3>
              <p className="text-xs text-gray-500">
                Mark each volunteer as Present or Absent for this event
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={volunteerSearch}
                onChange={(e) => setVolunteerSearch(e.target.value)}
                placeholder="Search volunteer..."
                className="w-full h-9 pl-8 pr-7 text-xs bg-white border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7040d0] focus:ring-2 focus:ring-[#7040d0]/15 transition shadow-2xs"
              />
              {volunteerSearch && (
                <button
                  type="button"
                  onClick={() => setVolunteerSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Volunteers Attendance Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Volunteer Name</th>
                    <th className="py-3.5 px-6">Enrollment Number</th>
                    <th className="py-3.5 px-6">Department</th>
                    <th className="py-3.5 px-6">Year</th>
                    <th className="py-3.5 px-6">Committee Position</th>
                    <th className="py-3.5 px-6 text-right">Attendance Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-xs">
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle size={28} className="text-gray-300" />
                          <p className="font-semibold text-sm text-gray-700">
                            No volunteers found
                          </p>
                          <p className="text-xs text-gray-400">
                            {volunteerSearch
                              ? `No volunteers match "${volunteerSearch}".`
                              : "No registered volunteers found in the system."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map((vol) => {
                      const volKey = vol.id || vol._id || vol.enrollmentNumber;
                      const currentStatus = currentEventAttendance[volKey];

                      return (
                        <tr
                          key={volKey}
                          className="hover:bg-purple-50/25 transition-colors"
                        >
                          {/* 1. Volunteer Name */}
                          <td className="py-4 px-6 font-bold text-gray-900 text-sm">
                            {vol.fullName}
                          </td>

                          {/* 2. Enrollment Number */}
                          <td className="py-4 px-6 text-gray-600 font-medium text-xs font-mono">
                            {vol.enrollmentNumber || vol.enrollmentNo || "—"}
                          </td>

                          {/* 3. Department (Clean text) */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                            {vol.department || "IT"}
                          </td>

                          {/* 4. Year (Clean text) */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                            {formatYearLabel(vol.year || vol.academicYear)}
                          </td>

                          {/* 5. Committee Position (Clean text) */}
                          <td className="py-4 px-6 text-gray-700 font-medium text-xs">
                            {vol.committeePosition || vol.committee || "Volunteer Member"}
                          </td>

                          {/* 5. Attendance Toggle Buttons */}
                          <td className="py-4 px-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Present Button */}
                              <button
                                type="button"
                                onClick={() => handleMark(volKey, "Present")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                                  currentStatus === "Present"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                                }`}
                              >
                                <UserCheck size={13} />
                                <span>Present</span>
                              </button>

                              {/* Absent Button */}
                              <button
                                type="button"
                                onClick={() => handleMark(volKey, "Absent")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                                  currentStatus === "Absent"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                                }`}
                              >
                                <UserX size={13} />
                                <span>Absent</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
              <span>
                Showing <strong>{filteredVolunteers.length}</strong> of{" "}
                <strong>{volunteers.length}</strong> volunteers
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;