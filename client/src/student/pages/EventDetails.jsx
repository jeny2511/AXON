import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, FileText, ArrowLeft, Check } from "lucide-react";
import StudentLayout from "../layouts/StudentLayout";
import "./pages.css";
import "./EventDetails.css";
import {
  fetchEventByIdApi,
  fetchMyRegistrationsApi,
  getActiveStudentId,
  getStudentProfile,
  checkRegistrationEligibility,
  registerForEventApi,
} from "../services/studentService";
import { getAssetUrl } from "../../utils/urlUtils";

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

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [imageError, setImageError] = useState(false);

  const checkRegistrationStatus = async (evId) => {
    try {
      const myRegs = await fetchMyRegistrationsApi();
      const match = myRegs.some(
        (r) =>
          (r.eventId?._id || r.eventId || r.event?._id || r.event?.id)?.toString() ===
          evId.toString()
      );
      setIsRegistered(match);
    } catch (e) {
      // not logged in or failed
    }
  };

  useEffect(() => {
    let mounted = true;
    if (eventId) {
      fetchEventByIdApi(eventId)
        .then((data) => {
          if (mounted && data) {
            setEvent(data);
            checkRegistrationStatus(data._id || data.id);
          }
        })
        .catch((err) => {
          console.warn("Failed to load event details from API:", err.message);
          if (mounted) setEvent(null);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [eventId]);

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

  const eligibility = student
    ? checkRegistrationEligibility(event, student)
    : { eligible: false, reason: "Login required." };

  const rulebooksList = [];
  if (Array.isArray(event.rulebooks) && event.rulebooks.length > 0) {
    event.rulebooks.forEach((rb) => {
      if (typeof rb === "string" && rb.trim()) {
        rulebooksList.push({ name: "Event Rulebook", url: rb.trim() });
      } else if (rb && rb.url) {
        rulebooksList.push({ name: rb.name || "Event Rulebook", url: rb.url.trim() });
      }
    });
  } else if (event.rulebook && typeof event.rulebook === "string" && event.rulebook.trim()) {
    rulebooksList.push({ name: "Event Rulebook", url: event.rulebook.trim() });
  } else if (event.rulebookUrl && typeof event.rulebookUrl === "string" && event.rulebookUrl.trim()) {
    rulebooksList.push({ name: "Event Rulebook", url: event.rulebookUrl.trim() });
  }

  const handleRegister = async () => {
    if (!studentId) {
      navigate(`/login?redirect=${encodeURIComponent(`/events/${event._id || event.id}`)}`);
      return;
    }

    try {
      setStatusMessage("");
      await registerForEventApi(event._id || event.id);
      setIsRegistered(true);
      setStatusMessage("You have successfully registered! Your attendance QR token is ready in My Events.");
      // Refresh event data to update registeredCount
      fetchEventByIdApi(eventId).then((data) => {
        if (data) setEvent(data);
      });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to register for event.";
      setStatusMessage(msg);
    }
  };

  const posterSrc = event.poster ? getAssetUrl(event.poster) : "";

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
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="event-details-card">
          {posterSrc && !imageError ? (
            <img
              src={posterSrc}
              alt={event.name || event.title}
              className="event-details-poster"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="event-details-poster-placeholder">
              <div className="placeholder-content">
                <Calendar size={42} />
                <span className="placeholder-title">{event.name || event.title}</span>
                <span className="placeholder-category">{event.category || "Event"}</span>
              </div>
            </div>
          )}

          <div className="event-details-content">
            <h1>{event.name || event.title}</h1>
            <p className="event-details-description">{event.description}</p>

            <div className="event-info">
              <p>
                <strong>Category:</strong> {event.category || "General"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {event.date
                  ? new Date(event.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : event.eventDate || "TBA"}
              </p>
              <p>
                <strong>Time:</strong> {event.startTime} - {event.endTime}
              </p>
              <p>
                <strong>Venue:</strong> {event.venue}
              </p>
              <p>
                <strong>Speaker / Coordinator:</strong> {event.speaker || event.speakerName || "TCF Team"}
              </p>
              <p>
                <strong>Eligible Departments:</strong>{" "}
                {event.eligibility?.branchCodes?.length > 0
                  ? event.eligibility.branchCodes.join(", ")
                  : event.eligibleDepartments?.length > 0
                  ? event.eligibleDepartments.join(", ")
                  : "ALL"}
              </p>
              <p>
                <strong>Eligible Years:</strong>{" "}
                {event.eligibility?.years?.length > 0
                  ? event.eligibility.years.join(", ")
                  : event.eligibleYears?.length > 0
                  ? event.eligibleYears.join(", ")
                  : "All Years"}
              </p>
              <p>
                <strong>Capacity:</strong> {event.registeredCount || 0} /{" "}
                {event.participantsLimit || event.participantLimit || "Unlimited"}
              </p>
              {(event.registration?.closeAt || event.registrationClose) && (
                <p>
                  <strong>Registration Closes:</strong>{" "}
                  {new Date(event.registration?.closeAt || event.registrationClose).toLocaleString()}
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
              {rulebooksList.length > 0 ? (
                rulebooksList.map((rb, idx) => (
                  <a
                    key={idx}
                    href={getAssetUrl(rb.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rulebook-button"
                  >
                    <FileText size={16} />
                    View Rulebook
                  </a>
                ))
              ) : (
                <span className="no-rulebook-text">
                  No rulebook available.
                </span>
              )}

              {isRegistered ? (
                <button type="button" className="register-button" disabled>
                  <Check size={16} /> Registered ✓
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