import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import "./pages.css";
import "./EventDetails.css";
import {
  getEventById,
  getActiveStudentId,
  getStudentProfile,
  isStudentRegistered,
  checkRegistrationEligibility,
  registerStudentForEvent,
  fetchEvents,
  fetchStudentRegistrations,
} from "../services/studentService";

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    department: "IT",
    year: 3,
  };

  const [, setSyncTick] = useState(0);

  useEffect(() => {
    fetchEvents().then(() => setSyncTick((t) => t + 1));
    if (studentId) {
      fetchStudentRegistrations(studentId).then(() => setSyncTick((t) => t + 1));
    }
    const handleSync = () => setSyncTick((t) => t + 1);
    window.addEventListener("axon-events-change", handleSync);
    window.addEventListener("axon-registrations-change", handleSync);
    return () => {
      window.removeEventListener("axon-events-change", handleSync);
      window.removeEventListener("axon-registrations-change", handleSync);
    };
  }, [studentId]);

  const event = getEventById(eventId || "EV001");
  const [statusMessage, setStatusMessage] = useState("");

  if (!event) {
    return (
      <StudentLayout>
        <div className="event-details-page">
          <div className="page-container">
            <h1 className="page-title">Event Not Found</h1>
            <p className="page-subtitle">The requested event could not be found.</p>
            <button
              type="button"
              className="rulebook-button"
              style={{ marginTop: "20px" }}
              onClick={() => navigate("/upcoming-events")}
            >
              ← Back to Upcoming Events
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const alreadyRegistered = student?.id ? isStudentRegistered(student.id, event.id || event._id) : false;
  const eligibility = student ? checkRegistrationEligibility(event, student) : { eligible: false, reason: "Login required." };

  const handleRegister = async () => {
    if (!studentId) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
      return;
    }

    if (!eligibility.eligible) {
      setStatusMessage(eligibility.reason);
      return;
    }

    try {
      const evId = event.id || event._id;
      const res = await registerStudentForEvent(student.id, evId);
      if (res && res.message) {
        setStatusMessage(res.message);
      } else {
        setStatusMessage("You have successfully registered! Your attendance QR token is ready.");
      }
    } catch (err) {
      setStatusMessage(err.message || "Failed to register for event.");
    }
  };

  return (
    <StudentLayout>
      <div className="event-details-page">
        <div className="page-container">
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              color: "#6a3bc5",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "12px",
              padding: 0,
            }}
          >
            ← Back
          </button>
        </div>

        <div className="event-details-card">
          <img
            src={event.poster}
            alt={event.name}
            className="event-details-poster"
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />

          <div className="event-details-content">
            <h1>{event.name}</h1>
            <p className="event-details-description">{event.description}</p>

            <div className="event-info">
              <p>
                <strong>Category:</strong> {event.category || "General"}
              </p>
              <p>
                <strong>Date:</strong> {event.eventDate}
              </p>
              <p>
                <strong>Time:</strong> {event.startTime} - {event.endTime}
              </p>
              <p>
                <strong>Venue:</strong> {event.venue}
              </p>
              <p>
                <strong>Speaker / Coordinator:</strong> {event.speakerName || "TCF Team"}
              </p>
              <p>
                <strong>Eligible Departments:</strong>{" "}
                {event.eligibleDepartments ? event.eligibleDepartments.join(", ") : "ALL"}
              </p>
              <p>
                <strong>Eligible Years:</strong>{" "}
                {event.eligibleYears ? event.eligibleYears.join(", ") : "All Years"}
              </p>
              <p>
                <strong>Capacity:</strong> {event.registeredCount || 0} /{" "}
                {event.participantLimit || "Unlimited"}
              </p>
              {event.registrationClose && (
                <p>
                  <strong>Registration Closes:</strong>{" "}
                  {new Date(event.registrationClose).toLocaleString()}
                </p>
              )}
            </div>

            {statusMessage && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "600",
                  background: statusMessage.includes("successfully") ? "#dff6ee" : "#fde8e8",
                  color: statusMessage.includes("successfully") ? "#187a5a" : "#b42318",
                }}
              >
                {statusMessage}
              </div>
            )}

            <div className="event-details-actions">
              {event.rulebook && (
                <a
                  href={event.rulebook}
                  target="_blank"
                  rel="noreferrer"
                  className="rulebook-button"
                >
                  View Rulebook PDF
                </a>
              )}

              {alreadyRegistered ? (
                <button type="button" className="register-button" disabled>
                  Registered ✓
                </button>
              ) : !eligibility.eligible ? (
                <button
                  type="button"
                  className="register-button"
                  disabled
                  title={eligibility.reason}
                >
                  {eligibility.reason.includes("full")
                    ? "Registration Full"
                    : eligibility.reason.includes("deadline") || eligibility.reason.includes("closed")
                    ? "Registration Closed"
                    : "Not Eligible"}
                </button>
              ) : (
                <button
                  type="button"
                  className="register-button"
                  onClick={handleRegister}
                >
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default EventDetails;