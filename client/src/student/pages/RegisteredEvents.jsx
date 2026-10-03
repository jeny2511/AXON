import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./pages.css";
import "./RegisteredEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import EventCard from "../components/EventCard/EventCard";
import {
  fetchMyRegistrationsApi,
  fetchMyAttendanceApi,
  getActiveStudentId,
} from "../services/studentService";
import { getStudentEventStage } from "../utils/eventLifecycle";

function RegisteredEvents() {
  const navigate = useNavigate();
  const studentId = getActiveStudentId();
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchMyRegistrationsApi().catch(() => []),
      fetchMyAttendanceApi().catch(() => []),
    ])
      .then(([regs, atts]) => {
        if (!mounted) return;
        const now = new Date();
        const attsList = atts || [];

        const activeUpcomingRegs = (regs || [])
          .filter((r) => {
            const ev = r.event || {};
            const eventId = ev._id || ev.id || r.eventId;
            const matchingAtt = attsList.find(
              (a) => (a.eventId?._id || a.eventId?.id || a.eventId) === eventId
            );
            const stage = getStudentEventStage({
              event: ev,
              registration: r,
              attendance: matchingAtt,
              now,
            });
            // Strictly "registered" stage (future event, registered, not attended)
            return stage === "registered";
          })
          .map((r) => ({
            ...(r.event || {}),
            name: r.event?.name || r.eventName || "Registered Event",
            registrationId: r.id || r._id,
            qrCode: r.qrToken || r.qrCode,
            qrToken: r.qrToken || r.qrCode,
          }));

        setRegisteredEvents(activeUpcomingRegs);
      })
      .catch((err) => {
        console.warn("Failed to load registered events:", err.message);
        if (mounted) setRegisteredEvents([]);
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
      <div className="registered-events-page">
        <div className="page-container">
          <h1 className="page-title">Registered Events</h1>
          <p className="page-subtitle">Future events you have successfully registered for.</p>
        </div>

        <div className="registered-events-section">
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
              Loading registered events...
            </div>
          ) : registeredEvents.length > 0 ? (
            <div className="events-grid">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event.id || event.registrationId}
                  title={event.name}
                  poster={event.poster}
                  date={event.eventDate}
                  time={`${event.startTime} - ${event.endTime}`}
                  venue={event.venue}
                  description={event.description}
                  status={event.status || "Registered"}
                  buttonText="View in My Events"
                  onClick={() => navigate("/my-events")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Upcoming Registered Events"
              message="You have no future registered events. Explore Upcoming Events to register, or check Ongoing Events / My Events."
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default RegisteredEvents;