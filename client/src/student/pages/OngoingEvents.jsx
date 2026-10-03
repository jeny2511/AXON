import { useState, useEffect } from "react";
import "./pages.css";
import "./OngoingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  fetchAllEventsApi,
  fetchMyRegistrationsApi,
  fetchMyAttendanceApi,
  getActiveStudentId,
  getStudentProfile,
} from "../services/studentService";
import {
  getEventTimingState,
  getAttendanceWindowInfo,
} from "../utils/eventLifecycle";

function OngoingEvents() {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    enrollmentNo: "220130107054",
  };

  const [ongoingEvents, setOngoingEvents] = useState([]);
  const [selectedQREvent, setSelectedQREvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [events, regs, atts] = await Promise.all([
        fetchAllEventsApi().catch(() => []),
        fetchMyRegistrationsApi().catch(() => []),
        fetchMyAttendanceApi().catch(() => []),
      ]);

      const now = new Date();
      const attsList = Array.isArray(atts) ? atts : [];
      const regsList = Array.isArray(regs) ? regs : [];

      // Set of event IDs where attendance is already marked present
      const attendedEventIds = new Set(
        attsList
          .filter((a) => a.status === "present" || a.attendanceStatus === "present")
          .map((a) => (a.eventId?._id || a.eventId?.id || a.eventId)?.toString())
      );

      // Map of registrations by event ID
      const regMap = new Map();
      regsList.forEach((r) => {
        const ev = r.event || {};
        const evId = (ev._id || ev.id || r.eventId?._id || r.eventId?.id || r.eventId)?.toString();
        if (
          evId &&
          !r.isDeleted &&
          (r.status === "registered" || r.status === "confirmed" || r.status === "attended")
        ) {
          regMap.set(evId, r);
        }
      });

      // Filter all active ongoing events that have not yet been marked present
      const ongoingList = (events || [])
        .filter((e) => {
          const evId = (e._id || e.id)?.toString();
          // Attended events move to My Events
          if (attendedEventIds.has(evId)) return false;
          if (e.status === "draft" || e.status === "cancelled" || e.isDeleted) return false;
          const timing = getEventTimingState(e, now);
          return timing === "ongoing";
        })
        .map((e) => {
          const evId = (e._id || e.id)?.toString();
          const reg = regMap.get(evId);
          const isRegistered = Boolean(reg);
          const qrToken =
            reg?.qrToken || reg?.qrCode || e.qrToken || e.qrCode || `QR-${evId}-${studentId}`;

          return {
            ...e,
            id: evId,
            _id: evId,
            name: e.name || e.title || "Ongoing Event",
            isRegistered,
            registration: reg,
            qrToken,
          };
        });

      setOngoingEvents(ongoingList);
    } catch (err) {
      console.error("Failed to load ongoing events:", err);
      setOngoingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [studentId]);

  return (
    <StudentLayout>
      <div className="ongoing-events-page">
        <div className="page-container">
          <h1 className="page-title">Ongoing Events</h1>
          <p className="page-subtitle">Events that are currently active and in session.</p>
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            Loading ongoing events...
          </div>
        ) : ongoingEvents.length > 0 ? (
          <div className="events-grid">
            {ongoingEvents.map((event) => (
              <EventCard
                key={event.id || event._id}
                title={event.name}
                poster={event.poster}
                date={event.eventDate}
                time={`${event.startTime} - ${event.endTime}`}
                venue={event.venue}
                description={event.description}
                status="Ongoing"
                buttonText="QR Code"
                onClick={() => setSelectedQREvent(event)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Ongoing Events"
            message="There are no active events running at the moment. When a registered event starts, it will appear here until your attendance is verified."
          />
        )}
      </div>

      {/* QR ATTENDANCE MODAL */}
      {selectedQREvent && (() => {
        const isRegistered = selectedQREvent.isRegistered;
        const windowInfo = getAttendanceWindowInfo(selectedQREvent, new Date());
        const qrToken = selectedQREvent.qrToken;

        return (
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

              <h2 style={{ color: "#1f1f29", marginBottom: "6px" }}>
                {isRegistered ? "Event Attendance Pass" : "Event QR Code"}
              </h2>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
                {selectedQREvent.name || selectedQREvent.title}
              </p>

              {/* CASE 4: Not registered */}
              {!isRegistered ? (
                <div>
                  <div
                    style={{
                      width: "220px",
                      height: "170px",
                      margin: "0 auto 16px",
                      padding: "16px",
                      background: "#fffbeb",
                      borderRadius: "16px",
                      border: "2px dashed #f59e0b",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ fontSize: "38px", color: "#d97706", marginBottom: "8px" }}>⚠️</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e" }}>
                      Not Registered
                    </div>
                    <div style={{ fontSize: "12px", color: "#b45309", marginTop: "6px", textAlign: "center" }}>
                      You have not registered for this event.
                    </div>
                  </div>

                  <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>
                    Attendance QR codes are only issued to registered participants.
                  </p>
                </div>
              ) : windowInfo.isBefore ? (
                /* CASE 2: Registered + Window Not Open Yet */
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                      }}
                    >
                      ⏳ Attendance window is not open yet.
                    </span>
                  </div>

                  <div
                    style={{
                      width: "220px",
                      height: "170px",
                      margin: "0 auto 16px",
                      padding: "16px",
                      background: "#fffbeb",
                      borderRadius: "16px",
                      border: "2px dashed #fcd34d",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ fontSize: "38px", color: "#d97706", marginBottom: "8px" }}>🔒</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e" }}>
                      Attendance window is not open yet.
                    </div>
                    <div style={{ fontSize: "11px", color: "#b45309", marginTop: "6px", textAlign: "center" }}>
                      Opens: {windowInfo.openTime ? windowInfo.openTime.toLocaleString() : "At event start"}
                    </div>
                  </div>
                </div>
              ) : windowInfo.isAfter ? (
                /* CASE 3: Registered + Window Closed */
                <div>
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        border: "1px solid #fecaca",
                      }}
                    >
                      ⛔ Attendance window is closed.
                    </span>
                  </div>

                  <div
                    style={{
                      width: "220px",
                      height: "170px",
                      margin: "0 auto 16px",
                      padding: "16px",
                      background: "#fef2f2",
                      borderRadius: "16px",
                      border: "2px dashed #fca5a5",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ fontSize: "38px", color: "#dc2626", marginBottom: "8px" }}>⛔</div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#991b1b" }}>
                      Attendance window is closed.
                    </div>
                    <div style={{ fontSize: "11px", color: "#b91c1c", marginTop: "6px", textAlign: "center" }}>
                      Closed: {windowInfo.closeTime ? windowInfo.closeTime.toLocaleString() : "Past"}
                    </div>
                  </div>
                </div>
              ) : (
                /* CASE 1: Registered + Attendance Window Open */
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 14px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: "700",
                        background: "#dcfce7",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      ✓ Attendance is open — Ready to Scan
                    </span>
                  </div>

                  <div
                    style={{
                      width: "210px",
                      height: "210px",
                      margin: "0 auto 16px",
                      padding: "10px",
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "2px solid #6366f1",
                      boxShadow: "0 8px 24px rgba(99, 102, 241, 0.15)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxSizing: "border-box",
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
                        qrToken
                      )}`}
                      alt="Attendance QR Code"
                      style={{ width: "190px", height: "190px", display: "block" }}
                    />
                  </div>

                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      fontWeight: "700",
                      color: "#475569",
                      background: "#f1f5f9",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      marginBottom: "16px",
                      wordBreak: "break-all",
                    }}
                  >
                    {qrToken}
                  </div>

                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "10px",
                      padding: "12px",
                      fontSize: "13px",
                      color: "#334155",
                      textAlign: "left",
                      marginBottom: "16px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <p style={{ margin: "3px 0" }}>
                      <strong>Student:</strong> {student.fullName}
                    </p>
                    <p style={{ margin: "3px 0" }}>
                      <strong>Enrollment No:</strong> {student.enrollmentNo || "220130107054"}
                    </p>
                    <p style={{ margin: "3px 0" }}>
                      <strong>Time:</strong> {selectedQREvent.startTime} - {selectedQREvent.endTime}
                    </p>
                  </div>

                  <p style={{ color: "#64748b", fontSize: "12.5px", margin: 0 }}>
                    Please present this QR code to a designated TCF Volunteer at the entrance to mark your attendance.
                  </p>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </StudentLayout>
  );
}

export default OngoingEvents;