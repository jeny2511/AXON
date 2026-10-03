import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ClipboardList, CheckCircle2, Award } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import StatsCard from "../components/StatsCard/StatsCard";

import {
  getActiveStudentId,
  fetchAllEventsApi,
  fetchMyRegistrationsApi,
  fetchMyAttendanceApi,
  fetchMyCertificatesApi,
} from "../services/studentService";
import {
  getEventTimingState,
  getEventDateBounds,
} from "../utils/eventLifecycle";

import "./pages.css";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const studentId = getActiveStudentId();

  const [stats, setStats] = useState({
    upcomingEvents: 0,
    registeredEvents: 0,
    completedEvents: 0,
    certificates: 0,
  });
  const [nearestEvent, setNearestEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      fetchAllEventsApi().catch(() => []),
      fetchMyRegistrationsApi().catch(() => []),
      fetchMyAttendanceApi().catch(() => []),
      fetchMyCertificatesApi().catch(() => []),
    ])
      .then(([events, regs, atts, certs]) => {
        if (!mounted) return;
        const now = new Date();
        const attsList = Array.isArray(atts) ? atts : [];
        const regsList = Array.isArray(regs) ? regs : [];

        // Set of event IDs the student has already been marked Present for
        const attendedEventIds = new Set(
          attsList
            .filter((a) => a.status === "present" || a.attendanceStatus === "present")
            .map((a) => (a.eventId?._id || a.eventId?.id || a.eventId)?.toString())
        );

        // 1. Filter genuinely upcoming events:
        // - Published/Active & Not Deleted
        // - Start datetime has NOT been reached yet (now < eventStart)
        // - Student has NOT already attended
        const upcoming = (events || []).filter((e) => {
          const evId = (e._id || e.id)?.toString();
          if (attendedEventIds.has(evId)) return false;
          if (e.status === "draft" || e.status === "cancelled" || e.isDeleted) return false;
          const timing = getEventTimingState(e, now);
          return timing === "upcoming";
        });

        // 2. Sort genuinely upcoming events to find the earliest/nearest one
        let nearest = null;
        if (upcoming.length > 0) {
          const sorted = [...upcoming].sort((a, b) => {
            const boundsA = getEventDateBounds(a);
            const boundsB = getEventDateBounds(b);
            const timeA = boundsA.start ? boundsA.start.getTime() : Infinity;
            const timeB = boundsB.start ? boundsB.start.getTime() : Infinity;
            return timeA - timeB;
          });
          nearest = sorted[0];
        }

        // Active future registrations where attendance is not yet present
        const activeRegs = regsList.filter((r) => {
          const ev = r.event || {};
          const eventId = (ev._id || ev.id || r.eventId)?.toString();
          const isAttended = attendedEventIds.has(eventId);
          return (r.status === "registered" || r.status === "confirmed") && !r.isDeleted && !isAttended;
        });

        const presentAtts = attsList.filter((a) => a.status === "present" || a.attendanceStatus === "present");
        const validCerts = Array.isArray(certs) ? certs : (certs?.data || []);

        setStats({
          upcomingEvents: upcoming.length,
          registeredEvents: activeRegs.length,
          completedEvents: presentAtts.length,
          certificates: validCerts.length,
        });
        setNearestEvent(nearest);
      })
      .catch((err) => {
        console.error("Failed to load dashboard data:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  return (
    <StudentLayout>
      <div className="dashboard-page">
        {/* Page Header */}
        <div className="page-container">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome to the AXON Student Dashboard.
          </p>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
            icon={Calendar}
          />

          <StatsCard
            title="Registered Events"
            value={stats.registeredEvents}
            icon={ClipboardList}
          />

          <StatsCard
            title="Attended Events"
            value={stats.completedEvents}
            icon={CheckCircle2}
          />

          <StatsCard
            title="Certificates"
            value={stats.certificates}
            icon={Award}
          />
        </div>

        {/* Nearest Upcoming Event */}
        <div className="dashboard-section">
          <h2 className="section-title">
            Next Upcoming Event
          </h2>

          {loading ? (
            <p style={{ color: "#666" }}>Loading upcoming events...</p>
          ) : nearestEvent ? (
            <EventCard
              title={nearestEvent.name}
              poster={nearestEvent.poster}
              date={nearestEvent.eventDate}
              time={`${nearestEvent.startTime} - ${nearestEvent.endTime}`}
              venue={nearestEvent.venue}
              description={nearestEvent.description}
              status={nearestEvent.status}
              buttonText="View Details"
              onClick={() => navigate(`/events/${nearestEvent.id || nearestEvent._id}`)}
            />
          ) : (
            <p style={{ color: "#666" }}>No upcoming events available.</p>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Dashboard;