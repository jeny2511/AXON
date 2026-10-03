import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./pages.css";
import "./UpcomingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import SearchBar from "../components/SearchBar/SearchBar";
import {
  fetchAllEventsApi,
  fetchMyRegistrationsApi,
  registerForEventApi,
  getActiveStudentId,
  getStudentProfile,
  isStudentRegistered,
  checkRegistrationEligibility,
  registerStudentForEvent,
} from "../services/studentService";
import { filterEventsBySearch } from "../utils/filterEvents";
import { getEventTimingState } from "../utils/eventLifecycle";
import { getAssetUrl } from "../../utils/urlUtils";

function UpcomingEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [eventsList, setEventsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    department: "IT",
    year: 3,
  };

  const [registeredEventIds, setRegisteredEventIds] = useState(new Set());

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, regsData] = await Promise.all([
        fetchAllEventsApi(),
        fetchMyRegistrationsApi().catch(() => []),
      ]);
      // Strictly keep events that have NOT started yet (now < eventStart)
      const now = new Date();
      const upcoming = (eventsData || []).filter((e) => {
        const timing = getEventTimingState(e, now);
        return timing === "upcoming" && e.status !== "cancelled" && !e.isDeleted;
      });

      setEventsList(upcoming);
      const regIds = new Set(regsData.map((r) => (r.eventId?._id || r.eventId || r.event?._id || r.event?.id)?.toString()));
      setRegisteredEventIds(regIds);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load upcoming events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = filterEventsBySearch(eventsList, searchTerm);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setRegistrationMessage("");
  };

  const handleClose = () => {
    setSelectedEvent(null);
    setRegistrationMessage("");
  };

  const handleRegister = async (event) => {
    try {
      setRegistrationMessage("");
      const evId = event._id || event.id;
      await registerForEventApi(evId);
      setRegisteredEventIds((prev) => new Set([...prev, evId.toString()]));
      setRegistrationMessage("Registered successfully! Your attendance QR token is available in My Events.");
      // Refresh event count
      loadData();
    } catch (err) {
      setRegistrationMessage(err.message || "Failed to register for event.");
    }
  };

  return (
    <StudentLayout>
      <div className="upcoming-events-page">
        <div className="page-container">
          <h1 className="page-title">Upcoming Events</h1>
          <p className="page-subtitle">Explore and register for upcoming TCF events.</p>
        </div>

        <div style={{ maxWidth: "600px", margin: "0 0 20px 0" }}>
          <SearchBar
            placeholder="Search upcoming events by title, venue, or keyword..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {loading ? (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#666" }}>
            Loading upcoming events...
          </div>
        ) : error ? (
          <div style={{ padding: "20px", background: "#fde8e8", color: "#b42318", borderRadius: "8px", fontWeight: "600" }}>
            {error}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const evId = (event._id || event.id)?.toString();
              const alreadyRegistered = registeredEventIds.has(evId);

              return (
                <EventCard
                  key={evId}
                  event={event}
                  title={event.name || event.title}
                  poster={event.poster || event.posterUrl}
                  date={event.eventDate || event.date}
                  time={event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : (event.time || "")}
                  venue={event.venue || event.location}
                  category={event.category}
                  speaker={event.speakerName || event.speaker}
                  description={event.description}
                  status={alreadyRegistered ? "Registered" : event.status}
                  buttonText="View Details"
                  onClick={() => handleViewEvent(event)}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="No Upcoming Events"
            message={
              searchTerm
                ? `No upcoming events match "${searchTerm}". Try a different search term.`
                : "There are no upcoming events at the moment."
            }
          />
        )}

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="event-modal-overlay" onClick={handleClose}>
            <div className="event-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={handleClose} aria-label="Close modal">
                ×
              </button>

              <img
                src={getAssetUrl(selectedEvent.poster)}
                alt={selectedEvent.name}
                className="modal-event-poster"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              <h2>{selectedEvent.name || selectedEvent.title}</h2>
              {selectedEvent.category && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: "600",
                    background: "#e8f2fc",
                    color: "#185a9d"
                  }}>
                    {selectedEvent.category}
                  </span>
                </div>
              )}

              <p className="modal-description">{selectedEvent.description || "No description provided."}</p>

              <div className="modal-event-details">
                <p>
                  <strong>Date:</strong> {selectedEvent.eventDate || (selectedEvent.date ? new Date(selectedEvent.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "TBA")}
                </p>
                <p>
                  <strong>Time:</strong> {selectedEvent.startTime && selectedEvent.endTime ? `${selectedEvent.startTime} - ${selectedEvent.endTime}` : (selectedEvent.time || "TBA")}
                </p>
                <p>
                  <strong>Venue:</strong> {selectedEvent.venue || selectedEvent.location || "Campus"}
                </p>
                <p>
                  <strong>Speaker / Coordinator:</strong> {selectedEvent.speakerName || selectedEvent.speaker || "TCF Team"}
                </p>
                <p>
                  <strong>Eligible Departments:</strong>{" "}
                  {Array.isArray(selectedEvent.eligibleDepartments) && selectedEvent.eligibleDepartments.length > 0
                    ? selectedEvent.eligibleDepartments.join(", ")
                    : Array.isArray(selectedEvent.eligibility?.branchCodes) && selectedEvent.eligibility.branchCodes.length > 0
                    ? selectedEvent.eligibility.branchCodes.join(", ")
                    : "ALL"}
                </p>
                <p>
                  <strong>Eligible Years:</strong>{" "}
                  {Array.isArray(selectedEvent.eligibleYears) && selectedEvent.eligibleYears.length > 0
                    ? selectedEvent.eligibleYears.join(", ")
                    : Array.isArray(selectedEvent.eligibility?.years) && selectedEvent.eligibility.years.length > 0
                    ? selectedEvent.eligibility.years.join(", ")
                    : "All Years"}
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedEvent.registeredCount || 0} /{" "}
                  {selectedEvent.participantLimit || selectedEvent.participantsLimit || "Unlimited"}
                </p>
                {(selectedEvent.registrationClose || selectedEvent.registration?.closeAt) && (
                  <p>
                    <strong>Registration Deadline:</strong>{" "}
                    {new Date(selectedEvent.registrationClose || selectedEvent.registration?.closeAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
              </div>

              {registrationMessage && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    fontWeight: "600",
                    background: registrationMessage.includes("successfully")
                      ? "#dff6ee"
                      : "#fde8e8",
                    color: registrationMessage.includes("successfully") ? "#187a5a" : "#b42318",
                  }}
                >
                  {registrationMessage}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="rulebook-button"
                  onClick={() => {
                    const rawRulebook =
                      selectedEvent.rulebook ||
                      selectedEvent.rulebookUrl ||
                      (Array.isArray(selectedEvent.rulebooks) && selectedEvent.rulebooks.length > 0
                        ? typeof selectedEvent.rulebooks[0] === "string"
                          ? selectedEvent.rulebooks[0]
                          : selectedEvent.rulebooks[0]?.url
                        : "") ||
                      "";
                    const rulebookUrl = rawRulebook ? getAssetUrl(rawRulebook) : "";
                    if (rulebookUrl) {
                      window.open(rulebookUrl, "_blank");
                    } else {
                      setRegistrationMessage("Rulebook is not available yet for this event.");
                    }
                  }}
                >
                  View Rulebook
                </button>

                {(() => {
                  const evId = (selectedEvent._id || selectedEvent.id)?.toString();
                  const alreadyRegistered = registeredEventIds.has(evId);
                  const eligibility = checkRegistrationEligibility(selectedEvent, student);

                  if (alreadyRegistered) {
                    return (
                      <button type="button" className="register-button" disabled>
                        Already Registered ✓
                      </button>
                    );
                  }

                  if (!eligibility.eligible) {
                    return (
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
                    );
                  }

                  return (
                    <button
                      type="button"
                      className="register-button"
                      onClick={() => handleRegister(selectedEvent)}
                    >
                      Register Now
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default UpcomingEvents;