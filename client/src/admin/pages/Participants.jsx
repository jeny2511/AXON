import { useState, useEffect } from "react";
import { Users, Search, Filter, Calendar, Mail, GraduationCap, CheckCircle, Clock, XCircle, AlertCircle, UserCheck } from "lucide-react";
import { registrationService } from "../../services/registrationService";
import { eventService } from "../../services/eventService";
import { attendanceService } from "../../services/attendanceService";

function Participants() {
  const [registrations, setRegistrations] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regRes, eventRes, attRes] = await Promise.all([
        registrationService.getAllRegistrations(),
        eventService.getEvents(),
        attendanceService.getAllAttendance().catch(() => ({ data: [] })),
      ]);
      setRegistrations(regRes.data || []);
      setEvents(eventRes.data || []);
      setAttendances(attRes.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkPresent = async (studentId, eventId) => {
    try {
      setActionLoading(`${studentId}_${eventId}`);
      await attendanceService.markManual({ studentId, eventId });
      const attRes = await attendanceService.getAllAttendance();
      setAttendances(attRes.data || []);
    } catch (err) {
      alert(err.message || "Failed to mark attendance.");
    } finally {
      setActionLoading(null);
    }
  };

  const getAttendanceForRegistration = (studentId, eventId) => {
    return attendances.find(
      (a) =>
        (a.studentId?._id || a.studentId) === studentId &&
        (a.eventId?._id || a.eventId) === eventId
    );
  };

  const filteredRegistrations = registrations.filter((reg) => {
    const student = reg.student || reg.studentId || {};
    const event = reg.event || reg.eventId || {};

    const matchesEvent =
      selectedEvent === "all" ||
      (event._id || event.id) === selectedEvent;

    const studentName = (student.fullName || student.name || "").toLowerCase();
    const studentEnrollment = (student.enrollmentNumber || student.enrollmentNo || "").toLowerCase();
    const studentEmail = (student.email || "").toLowerCase();
    const eventName = (event.name || event.title || "").toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch =
      studentName.includes(q) ||
      studentEnrollment.includes(q) ||
      studentEmail.includes(q) ||
      eventName.includes(q);

    return matchesEvent && matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "registered":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>
            <CheckCircle size={12} /> Registered
          </span>
        );
      case "cancelled":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", fontSize: "0.75rem", fontWeight: 600 }}>
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }}>
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  return (
    <main className="dashboard">
      <div className="page-heading">
        <div>
          <h2>Participant Management</h2>
          <p>Monitor event registrations, attendance records, and participant details across all events</p>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", color: "#f87171", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="panel" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", flex: 1 }}>
            <div style={{ position: "relative", minWidth: "260px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search by student name, enrollment, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-main)" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Filter size={16} style={{ color: "var(--text-muted)" }} />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                style={{ padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", color: "var(--text-main)" }}
              >
                <option value="all">All Events ({events.length})</option>
                {events.map((ev) => (
                  <option key={ev._id || ev.id} value={ev._id || ev.id}>
                    {ev.name} ({ev.registeredCount || 0}/{ev.participantsLimit || "Unlimited"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", fontWeight: 500 }}>
            Showing {filteredRegistrations.length} participant{filteredRegistrations.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Participant Table */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <h3>Registered Participants & Attendance</h3>
            <p>Live registration and attendance records from MongoDB</p>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading participants and attendance records...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)" }}>
            <Users size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontWeight: 500, fontSize: "1rem" }}>No registrations found</p>
            <p style={{ fontSize: "0.85rem" }}>
              {searchQuery || selectedEvent !== "all"
                ? "Try adjusting your filters or search query"
                : "Students who register for events will appear here"}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "12px 16px" }}>Student</th>
                  <th style={{ padding: "12px 16px" }}>Enrollment</th>
                  <th style={{ padding: "12px 16px" }}>Department / Year</th>
                  <th style={{ padding: "12px 16px" }}>Event</th>
                  <th style={{ padding: "12px 16px" }}>Registration</th>
                  <th style={{ padding: "12px 16px" }}>Attendance</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => {
                  const student = reg.student || reg.studentId || {};
                  const event = reg.event || reg.eventId || {};
                  const studentIdVal = student._id || student.id;
                  const eventIdVal = event._id || event.id;
                  const att = getAttendanceForRegistration(studentIdVal, eventIdVal);
                  const isPresent = att && att.status === "present";
                  const isActionLoading = actionLoading === `${studentIdVal}_${eventIdVal}`;

                  return (
                    <tr key={reg._id || reg.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                          {student.fullName || student.name || "Student"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Mail size={12} /> {student.email || "N/A"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontWeight: 600 }}>
                        {student.enrollmentNumber || student.enrollmentNo || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <GraduationCap size={14} style={{ color: "var(--text-muted)" }} />
                          <span>{student.department || "N/A"}</span>
                          {student.year && <span style={{ color: "var(--text-muted)" }}>({student.year})</span>}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 500, color: "var(--text-main)" }}>{event.name || event.title || "N/A"}</div>
                        {(event.eventDate || event.date) && (
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Calendar size={12} /> {event.eventDate || (event.date ? new Date(event.date).toISOString().split("T")[0] : "")}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {getStatusBadge(reg.status)}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isPresent ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", fontSize: "0.75rem", fontWeight: 600 }}>
                            <CheckCircle size={12} /> Present ({att.method === "qr" ? "QR" : "Manual"})
                          </span>
                        ) : (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "4px", background: "rgba(234, 179, 8, 0.15)", color: "#eab308", fontSize: "0.75rem", fontWeight: 600 }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {!isPresent && reg.status === "registered" && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleMarkPresent(student._id || student.id, event._id || event.id)}
                            style={{
                              background: "rgba(79, 70, 229, 0.1)",
                              color: "#6366f1",
                              border: "1px solid #6366f1",
                              borderRadius: "6px",
                              padding: "6px 10px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <UserCheck size={12} />
                            {isActionLoading ? "Marking..." : "Mark Present"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

export default Participants;
