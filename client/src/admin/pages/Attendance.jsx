import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { eventService } from "../../services/eventService";
import { adminService } from "../../services/adminService";
import { volunteerService } from "../../services/volunteerService";

function Attendance() {
  const [eventsList, setEventsList] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [evRes, volRes, attRes] = await Promise.all([
        eventService.getEvents(),
        adminService.getUsers({ role: "volunteer" }).catch(() => ({ data: [] })),
        volunteerService.getAttendance().catch(() => ({ data: [] })),
      ]);

      const rawVolunteers = volRes.data || volRes || [];
      const volunteerList = Array.isArray(rawVolunteers)
        ? rawVolunteers.filter((u) => u.role === "volunteer")
        : [];

      setEventsList(evRes.data || evRes || []);
      setVolunteers(volunteerList);
      setAttendances(attRes.data || attRes || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load volunteer attendance data:", err);
      setError(err.message || "Failed to load events and volunteers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEventVolunteerAttendance = (eventId) => {
    return attendances.filter((att) => {
      const eId = att.eventId?._id || att.eventId || att.event;
      return eId === eventId || eId === String(eventId);
    });
  };

  const isVolunteerPresent = (volunteerId, eventId) => {
    const eventAtts = getEventVolunteerAttendance(eventId);
    return eventAtts.some((a) => {
      const vId = a.volunteerId?._id || a.volunteerId;
      return vId === volunteerId || vId === String(volunteerId);
    });
  };

  const handleToggleAttendance = async (volunteerId) => {
    if (!selectedEvent) return;
    const eventId = selectedEvent._id || selectedEvent.id;
    const alreadyPresent = isVolunteerPresent(volunteerId, eventId);

    try {
      if (alreadyPresent) {
        // Find attendance record to delete
        const attRecord = getEventVolunteerAttendance(eventId).find((a) => {
          const vId = a.volunteerId?._id || a.volunteerId;
          return vId === volunteerId || vId === String(volunteerId);
        });

        if (attRecord) {
          await volunteerService.deleteAttendance(attRecord._id || attRecord.id);
          setAttendances((prev) =>
            prev.filter((a) => (a._id || a.id) !== (attRecord._id || attRecord.id))
          );
        }
      } else {
        const evDate = selectedEvent.date || selectedEvent.eventDate || new Date().toISOString().split("T")[0];
        const evTime = selectedEvent.startTime || "10:00 AM";
        const evVenue = selectedEvent.venue || "Campus";
        const res = await volunteerService.markAttendance({
          volunteerId,
          eventId,
          eventName: selectedEvent.name,
          activityType: "event",
          date: evDate,
          time: evTime,
          venue: evVenue,
          attendanceStatus: "present",
        });

        if (res.data) {
          setAttendances((prev) => [res.data, ...prev]);
        } else {
          await fetchData();
        }
      }
    } catch (err) {
      alert(err.message || "Failed to update attendance.");
    }
  };

  const handleSelectAll = async () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent._id || selectedEvent.id;
    const evDate = selectedEvent.date || selectedEvent.eventDate || new Date().toISOString().split("T")[0];
    const evTime = selectedEvent.startTime || "10:00 AM";
    const evVenue = selectedEvent.venue || "Campus";

    try {
      setSubmitting(true);
      for (const vol of volunteers) {
        const vId = vol._id || vol.id;
        if (!isVolunteerPresent(vId, eventId)) {
          await volunteerService.markAttendance({
            volunteerId: vId,
            eventId,
            eventName: selectedEvent.name,
            activityType: "event",
            date: evDate,
            time: evTime,
            venue: evVenue,
            attendanceStatus: "present",
          });
        }
      }
      const attRes = await volunteerService.getAttendance();
      setAttendances(attRes.data || []);
      alert("All volunteers marked as present!");
    } catch (err) {
      alert(err.message || "Failed to mark all present.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!selectedEvent) return;
    const eventId = selectedEvent._id || selectedEvent.id;

    let csv = "Volunteer Name,Enrollment / ID,Department,Semester,Attendance Status\n";

    volunteers.forEach((volunteer) => {
      const vId = volunteer._id || volunteer.id;
      const present = isVolunteerPresent(vId, eventId);
      const status = present ? "Present" : "Absent";

      csv += `"${volunteer.fullName}","${volunteer.enrollmentNumber || vId}","${volunteer.department}","${volunteer.semester || volunteer.year || "N/A"}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(selectedEvent.name || "event").replace(/[^a-zA-Z0-9]/g, "_")}_volunteer_attendance.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getAttendanceStats = (eventId) => {
    const presentCount = volunteers.filter((vol) =>
      isVolunteerPresent(vol._id || vol.id, eventId)
    ).length;

    const absentCount = volunteers.length - presentCount;
    const percentage =
      volunteers.length > 0 ? Math.round((presentCount / volunteers.length) * 100) : 0;

    return {
      present: presentCount,
      absent: absentCount,
      percentage,
    };
  };

  return (
    <main className="dashboard admin-attendance-page">
      <div className="page-heading">
        <div>
          <h2>Volunteer Attendance</h2>
          <p>Manage and track attendance of volunteers for each event</p>
        </div>
      </div>

      {error && (
        <div style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.5rem" }} />
          <p>Loading events and volunteer data...</p>
        </div>
      ) : !selectedEvent ? (
        <section className="attendance-event-section">
          <div className="attendance-section-header">
            <div>
              <h3>All Events</h3>
              <p>Select an event to manage volunteer attendance</p>
            </div>
            <span className="attendance-event-count-badge">
              <CalendarDays size={14} />
              {eventsList.length} Events
            </span>
          </div>

          <div className="attendance-event-list">
            {eventsList.map((event) => {
              const eventId = event._id || event.id;
              const stats = getAttendanceStats(eventId);

              return (
                <div
                  className="attendance-event-card"
                  key={eventId}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="attendance-card-main">
                    <div className="event-card-header">
                      <span className="event-type-badge">{event.category || "Workshop"}</span>
                      <h3 className="event-title">{event.name}</h3>
                    </div>

                    <div className="event-meta-row">
                      <span className="event-meta-item">
                        <CalendarDays size={15} className="meta-icon" />
                        {event.date
                          ? new Date(event.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : event.eventDate || "Date TBA"}
                      </span>
                      <span className="event-meta-item">
                        <MapPin size={15} className="meta-icon" />
                        {event.venue || "Campus Venue"}
                      </span>
                    </div>
                  </div>

                  <div className="attendance-stats-row">
                    <div className="stat-badge stat-present">
                      <UserCheck size={16} />
                      <span><strong>{stats.present}</strong> Present</span>
                    </div>
                    <div className="stat-badge stat-absent">
                      <UserX size={16} />
                      <span><strong>{stats.absent}</strong> Absent</span>
                    </div>
                    <div className="stat-badge stat-turnout">
                      <Users size={16} />
                      <span><strong>{stats.percentage}%</strong> Turnout</span>
                    </div>
                  </div>

                  <div className="attendance-card-action">
                    <button type="button" className="manage-attendance-btn">
                      <span>Manage Attendance</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="attendance-sheet-section">
          <button
            type="button"
            className="back-button"
            onClick={() => setSelectedEvent(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              background: "none",
              border: "none",
              color: "#7040d0",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>

          <div
            className="sheet-header-card"
            style={{
              background: "#ffffff",
              padding: "1.5rem",
              borderRadius: "0.75rem",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <span style={{ color: "#7040d0", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
                  {selectedEvent.category || "Event"}
                </span>
                <h3 style={{ margin: "0.25rem 0", fontSize: "1.35rem", color: "#0f172a" }}>{selectedEvent.name}</h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  {selectedEvent.venue} • {selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : selectedEvent.eventDate || "Date TBD"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={submitting}
                  className="primary-button"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <CheckCircle2 size={16} />
                  {submitting ? "Marking..." : "Mark All Present"}
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  style={{
                    padding: "0.6rem 1rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    color: "#334155",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: 500,
                  }}
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "2rem", marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", flexWrap: "wrap" }}>
              {(() => {
                const s = getAttendanceStats(selectedEvent._id || selectedEvent.id);
                return (
                  <>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Volunteers</span>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", color: "#0f172a" }}>{volunteers.length}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#16a34a" }}>Present</span>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", color: "#16a34a" }}>{s.present}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#dc2626" }}>Absent</span>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", color: "#dc2626" }}>{s.absent}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#7040d0" }}>Attendance Rate</span>
                      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold", color: "#7040d0" }}>{s.percentage}%</p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem" }}>Volunteer</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Enrollment No</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Department</th>
                  <th style={{ padding: "0.75rem 1rem" }}>Semester</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((vol) => {
                  const vId = vol._id || vol.id;
                  const eventId = selectedEvent._id || selectedEvent.id;
                  const present = isVolunteerPresent(vId, eventId);

                  return (
                    <tr key={vId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "0.75rem 1rem", fontWeight: 500, color: "#0f172a" }}>
                        {vol.fullName}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                        {vol.enrollmentNumber || vId}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#334155" }}>
                        {vol.department}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "#64748b" }}>
                        {vol.semester || vol.year || "N/A"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleAttendance(vId)}
                          style={{
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0.375rem",
                            border: "none",
                            fontWeight: 600,
                            cursor: "pointer",
                            background: present ? "#dcfce7" : "#f1f5f9",
                            color: present ? "#15803d" : "#64748b",
                          }}
                        >
                          {present ? "Present ✓" : "Mark Present"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default Attendance;