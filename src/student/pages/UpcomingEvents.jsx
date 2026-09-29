import { useState } from "react";
import "./UpcomingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import { getUpcomingEvents } from "../services/studentService";

function UpcomingEvents() {
  const events = getUpcomingEvents();
  const studentId = "ST002";

  const [selectedEvent, setSelectedEvent] = useState(null);

  const getStoredRegistrations = () => {
    return JSON.parse(
      localStorage.getItem(`axon_registrations_${studentId}`) || "[]"
    );
  };

  const [registeredEvents, setRegisteredEvents] = useState(
    getStoredRegistrations().map((registration) => registration.eventId)
  );

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleRegister = (event) => {
    if (registeredEvents.includes(event.id)) {
      return;
    }

    const existingRegistrations = getStoredRegistrations();

    const newRegistration = {
      registrationId: `REG-${Date.now()}`,
      studentId: studentId,
      eventId: event.id,
      registeredAt: new Date().toISOString(),
      status: "registered",
      attendanceStatus: "pending",
    };

    localStorage.setItem(
      `axon_registrations_${studentId}`,
      JSON.stringify([
        ...existingRegistrations,
        newRegistration,
      ])
    );

    setRegisteredEvents([
      ...registeredEvents,
      event.id,
    ]);
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

  return (
    <StudentLayout>
      <div className="student-page">

        <div className="page-header">
          <h1>Upcoming Events</h1>
          <p>Explore and register for upcoming TCF events.</p>
        </div>

        {events.length > 0 ? (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                title={event.name}
                poster={event.poster}
                date={event.eventDate}
                time={`${event.startTime} - ${event.endTime}`}
                venue={event.venue}
                description={event.description}
                status={event.status}
                buttonText="View Event"
                onClick={() => handleViewEvent(event)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Upcoming Events"
            message="There are no upcoming events at the moment."
          />
        )}

        {selectedEvent && (
          <div
            className="event-modal-overlay"
            onClick={handleClose}
          >
            <div
              className="event-modal"
              onClick={(e) => e.stopPropagation()}
            >

              <button
                className="modal-close"
                onClick={handleClose}
              >
                ×
              </button>

              <img
                src={selectedEvent.poster}
                alt={selectedEvent.name}
                className="modal-event-poster"
              />

              <h2>{selectedEvent.name}</h2>

              <p className="modal-description">
                {selectedEvent.description}
              </p>

              <div className="modal-event-details">
                <p>
                  <strong>Date:</strong>{" "}
                  {selectedEvent.eventDate}
                </p>

                <p>
                  <strong>Time:</strong>{" "}
                  {selectedEvent.startTime} -{" "}
                  {selectedEvent.endTime}
                </p>

                <p>
                  <strong>Venue:</strong>{" "}
                  {selectedEvent.venue}
                </p>
              </div>

              <div className="modal-actions">

                <button
                  className="rulebook-button"
                  onClick={() => {
                    if (selectedEvent.rulebook) {
                      window.open(
                        selectedEvent.rulebook,
                        "_blank"
                      );
                    } else {
                      alert("Rulebook is not available yet.");
                    }
                  }}
                >
                  View Rulebook
                </button>

                <button
                  className="register-button"
                  onClick={() => handleRegister(selectedEvent)}
                  disabled={
                    selectedEvent.registrationStatus !== "open" ||
                    registeredEvents.includes(selectedEvent.id)
                  }
                >
                  {registeredEvents.includes(selectedEvent.id)
                    ? "Registered"
                    : selectedEvent.registrationStatus === "full"
                    ? "Registration Full"
                    : selectedEvent.registrationStatus === "closed"
                    ? "Registration Closed"
                    : "Register"}
                </button>

              </div>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}

export default UpcomingEvents;