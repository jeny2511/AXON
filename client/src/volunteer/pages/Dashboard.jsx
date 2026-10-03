import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Users,
  GraduationCap,
  ClipboardCheck,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Calendar,
} from "lucide-react";
import { events as mockEvents, users as mockUsers, registrations as mockRegistrations, attendances as mockAttendances } from "../../mockData";
import api from "../../services/api";

const quickAccessItems = [
  {
    title: "Manage Events",
    description: "View and manage all events",
    icon: CalendarDays,
    path: "/volunteer/events",
  },
  {
    title: "Registrations & Attendance",
    description: "Check registered students and scan QR",
    icon: GraduationCap,
    path: "/volunteer/registrations",
  },
  {
    title: "My Presence",
    description: "Track your volunteer attendance",
    icon: ClipboardCheck,
    path: "/volunteer/presence",
  },
  {
    title: "My Profile",
    description: "View and update your profile",
    icon: Users,
    path: "/volunteer/profile",
  },
];

function Dashboard() {
  const [liveEvents, setLiveEvents] = useState(() => {
    const cached = localStorage.getItem("axon_live_events");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return mockEvents;
  });

  const [liveVolunteersCount, setLiveVolunteersCount] = useState(
    mockUsers.filter((u) => u.role === "volunteer").length
  );

  useEffect(() => {
    // Fetch live events
    api.get("/events")
      .then((res) => {
        const list = res?.events || res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          const normalized = list.map((ev) => ({
            ...ev,
            id: ev._id || ev.id,
            _id: ev._id || ev.id,
            name: ev.name || ev.title,
            category: ev.category || "Workshop",
            eventDate: ev.date ? ev.date.split("T")[0] : ev.eventDate,
            date: ev.date ? ev.date.split("T")[0] : ev.eventDate,
            startTime: ev.startTime || "10:00 AM",
            endTime: ev.endTime || "01:00 PM",
            venue: ev.venue || "Campus Venue",
            status: ev.status || "upcoming",
          }));
          setLiveEvents(normalized);
          try {
            localStorage.setItem("axon_live_events", JSON.stringify(normalized));
          } catch {}
        }
      })
      .catch(() => {});

    // Fetch live volunteers
    api.get("/volunteer")
      .then((res) => {
        const list = res?.data || res?.volunteers || (Array.isArray(res) ? res : []);
        if (Array.isArray(list) && list.length > 0) {
          setLiveVolunteersCount(list.length);
        }
      })
      .catch(() => {});

    const handleSync = () => {
      const cached = localStorage.getItem("axon_live_events");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setLiveEvents(parsed);
        } catch {}
      }
    };
    window.addEventListener("axon-events-change", handleSync);
    return () => window.removeEventListener("axon-events-change", handleSync);
  }, []);

  const totalEventsCount = liveEvents.length;
  const upcomingEventsCount = liveEvents.filter((e) => e.status === "upcoming").length;
  const totalVolunteersCount = liveVolunteersCount;
  const totalStudentsCount = mockUsers.filter((u) => u.role === "student").length;
  const totalRegistrationsCount = mockRegistrations.filter((r) => r.status === "registered").length;

  const avgAttendancePercent =
    totalRegistrationsCount > 0
      ? Math.round((mockAttendances.length / totalRegistrationsCount) * 100)
      : 85;

  const stats = [
    {
      title: "Total Events",
      value: String(totalEventsCount),
      subtext: `${upcomingEventsCount} upcoming events`,
      icon: CalendarDays,
    },
    {
      title: "Active Volunteers",
      value: String(totalVolunteersCount),
      subtext: "Assigned to active committees",
      icon: Users,
    },
    {
      title: "Registered Students",
      value: String(totalStudentsCount),
      subtext: `${totalRegistrationsCount} total event registrations`,
      icon: GraduationCap,
    },
    {
      title: "Attendance Rate",
      value: `${avgAttendancePercent}%`,
      subtext: `${mockAttendances.length} verified attendances`,
      icon: ClipboardCheck,
    },
  ];

  const upcomingList = useMemo(() => {
    return liveEvents
      .filter((e) => e.status === "upcoming")
      .slice(0, 4)
      .map((event) => {
        const eventRegCount = mockRegistrations.filter(
          (r) => r.eventId === event.id && r.status === "registered"
        ).length;

        const dateDisplay = event.eventDate || event.date
          ? new Date(`${(event.eventDate || event.date).includes("T") ? event.eventDate || event.date : (event.eventDate || event.date) + "T00:00:00"}`).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "TBD";

        return {
          id: event.id || event._id,
          title: event.name || event.eventName || "Event",
          date: dateDisplay,
          time: event.startTime ? `${event.startTime} - ${event.endTime}` : "10:00 AM",
          registered: event.registeredCount || eventRegCount,
          status: "Upcoming",
        };
      });
  }, [liveEvents]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Overview of your event management system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">
                  {stat.title}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7040d0]">
                  <Icon size={19} />
                </div>
              </div>

              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {stat.subtext}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Upcoming Events */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-xs lg:col-span-7 xl:col-span-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Upcoming Events
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Events scheduled for the upcoming days
              </p>
            </div>

            <Link
              to="/volunteer/events"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7040d0] hover:underline transition"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {upcomingList.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                No upcoming events scheduled at this moment.
              </p>
            ) : (
              upcomingList.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-xl p-3 transition hover:bg-gray-50/80 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7040d0]">
                      <CalendarDays size={20} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        {event.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={13} />
                          {event.date}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} />
                          {event.time}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                    <div className="text-right">
                      <span className="block text-sm font-bold text-gray-800">
                        {event.registered}
                      </span>
                      <span className="block text-[10px] text-gray-400">
                        Registered
                      </span>
                    </div>

                    <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Quick Access */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-xs lg:col-span-5 xl:col-span-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Quick Access
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">
              Frequently used management sections
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            {quickAccessItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.path}
                  className="group flex items-center justify-between rounded-xl p-3 transition hover:bg-purple-50/40"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-50 text-[#7040d0] transition group-hover:bg-[#7040d0] group-hover:text-white">
                      <Icon size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 transition group-hover:text-[#7040d0]">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={16}
                    className="text-gray-400 transition group-hover:text-[#7040d0]"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;