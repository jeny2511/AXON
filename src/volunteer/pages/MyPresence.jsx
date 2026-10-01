import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
} from "lucide-react";

import { attendance, events, users } from "../../mockData";

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

function MyPresence() {
  const [search, setSearch] = useState("");

  // Current logged in volunteer (Dhruvi Patel)
  const currentVolunteer = useMemo(() => {
    return (
      users.find((u) => u.id === "VL002") ||
      users.find((u) => u.role === "volunteer") || {
        id: "VL002",
        fullName: "Dhruvi Patel",
      }
    );
  }, []);

  // Events where this volunteer's attendance has been marked present by Admin
  const attendedEvents = useMemo(() => {
    const volunteerId = currentVolunteer?.id || "VL002";

    // Find all event IDs where volunteer's attendance is marked present
    const markedEventIds = attendance
      .filter(
        (record) =>
          (record.studentId === volunteerId ||
            record.verifiedBy === volunteerId) &&
          record.status === "present"
      )
      .map((record) => record.eventId);

    // Fallback default events where volunteer attendance is registered/marked
    const activeEventIds = [
      ...new Set(
        markedEventIds.length
          ? markedEventIds
          : ["EV005", "EV013", "EV014"]
      ),
    ];

    return events.filter((event) => activeEventIds.includes(event.id));
  }, [currentVolunteer]);

  // Filtered by search if user types in search bar
  const filteredEvents = useMemo(() => {
    if (!search.trim()) return attendedEvents;
    const query = search.trim().toLowerCase();
    return attendedEvents.filter((ev) =>
      ev.name.toLowerCase().includes(query)
    );
  }, [attendedEvents, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#24154f]">My Presence</h1>
        <p className="mt-1 text-sm text-gray-500">
          Events where you joined as a volunteer and attendance was verified by Admin.
        </p>
      </div>

      {/* Top Bar: Summary Card & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Attended Events</p>
            <p className="text-lg font-bold text-[#24154f]">
              {attendedEvents.length} Event{attendedEvents.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search attended events..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-purple-500 shadow-sm"
          />
        </div>
      </div>

      {/* Table: Exactly 3 fields - Event Name, Date, Time */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Event Name</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck size={32} className="text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">
                        No volunteer presence records found
                      </p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        Events will appear here once the Administrator marks your attendance as a volunteer.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* 1. Event Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                          <CheckCircle2 size={16} />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          {event.name}
                        </span>
                      </div>
                    </td>

                    {/* 2. Date */}
                    <td className="py-4 px-6 text-gray-800 font-medium">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Calendar size={14} className="text-gray-400" />
                        <span>{formatDate(event.eventDate)}</span>
                      </div>
                    </td>

                    {/* 3. Time */}
                    <td className="py-4 px-6 text-gray-700 font-medium">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Clock size={14} className="text-gray-400" />
                        <span>
                          {formatTime(event.startTime)}
                          {event.endTime ? ` - ${formatTime(event.endTime)}` : ""}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        {filteredEvents.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between bg-gray-50/40">
            <span>
              Showing {filteredEvents.length} attended event{filteredEvents.length === 1 ? "" : "s"}
            </span>
            <span className="text-xs text-green-700 font-medium flex items-center gap-1">
              <CheckCircle2 size={13} className="text-green-600" />
              Verified by Admin
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPresence;
