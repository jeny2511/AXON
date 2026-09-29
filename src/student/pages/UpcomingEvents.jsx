import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./pages.css";
import "./UpcomingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import SearchBar from "../components/SearchBar/SearchBar";
import {
  getUpcomingEvents,
  getActiveStudentId,
  getStudentProfile,
  isStudentRegistered,
  checkRegistrationEligibility,
  registerStudentForEvent,
} from "../services/studentService";
import { filterEventsBySearch } from "../utils/filterEvents";

function UpcomingEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchTerm = searchParams.get("search") || "";
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationMessage, setRegistrationMessage] = useState("");

  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    id: studentId,
    fullName: "Student",
    department: "IT",
    year: 3,
  };

  const allUpcoming = getUpcomingEvents();
  const filteredEvents = filterEventsBySearch(allUpcoming, searchTerm);

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

  const handleRegister = (event) => {
    const eligibility = checkRegistrationEligibility(event, student);
    if (!eligibility.eligible) {
      setRegistrationMessage(eligibility.reason);
      return;
    }

    registerStudentForEvent(student.id, event.id);
    setRegistrationMessage("Registered successfully! Your attendance QR is available in My Events.");
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

        {filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const alreadyRegistered = isStudentRegistered(student.id, event.id);

              return (
                <EventCard
                  key={event.id}
                  title={event.name}
                  poster={event.poster}
                  date={event.eventDate}
                  time={`${event.startTime} - ${event.endTime}`}
                  venue={event.venue}
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
                src={selectedEvent.poster}
                alt={selectedEvent.name}
                className="modal-event-poster"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />

              <h2>{selectedEvent.name}</h2>

              <p className="modal-description">{selectedEvent.description}</p>

              <div className="modal-event-details">
                <p>
                  <strong>Date:</strong> {selectedEvent.eventDate}
                </p>
                <p>
                  <strong>Time:</strong> {selectedEvent.startTime} - {selectedEvent.endTime}
                </p>
                <p>
                  <strong>Venue:</strong> {selectedEvent.venue}
                </p>
                <p>
                  <strong>Speaker / Coordinator:</strong> {selectedEvent.speakerName || "TCF Team"}
                </p>
                <p>
                  <strong>Eligible Departments:</strong>{" "}
                  {selectedEvent.eligibleDepartments
                    ? selectedEvent.eligibleDepartments.join(", ")
                    : "ALL"}
                </p>
                <p>
                  <strong>Eligible Years:</strong>{" "}
                  {selectedEvent.eligibleYears
                    ? selectedEvent.eligibleYears.join(", ")
                    : "All Years"}
                </p>
                <p>
                  <strong>Capacity:</strong> {selectedEvent.registeredCount || 0} /{" "}
                  {selectedEvent.participantLimit || "Unlimited"}
                </p>
                {selectedEvent.registrationClose && (
                  <p>
                    <strong>Registration Deadline:</strong>{" "}
                    {new Date(selectedEvent.registrationClose).toLocaleString("en-US", {
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
                    if (selectedEvent.rulebook) {
                      window.open(selectedEvent.rulebook, "_blank");
                    } else {
                      setRegistrationMessage("Rulebook is not available yet for this event.");
                    }
                  }}
                >
                  View Rulebook
                </button>

                {(() => {
                  const alreadyRegistered = isStudentRegistered(student.id, selectedEvent.id);
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