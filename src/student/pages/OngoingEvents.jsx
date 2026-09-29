import { useState } from "react";
import "./OngoingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import QRAttendance from "./QRAttendance";
import {
  getOngoingEvents,
  getStudentRegistrations,
} from "../services/studentService";

function OngoingEvents() {
  const studentId = "ST002";

  const ongoingEvents = getOngoingEvents();

  const serviceRegistrations = getStudentRegistrations(studentId);

  const localRegistrations = JSON.parse(
    localStorage.getItem(`axon_registrations_${studentId}`) || "[]"
  );

  const allRegistrations = [
    ...serviceRegistrations,
    ...localRegistrations.filter(
      (localRegistration) =>
        !serviceRegistrations.some(
          (serviceRegistration) =>
            serviceRegistration.eventId === localRegistration.eventId
        )
    ),
  ];

  // Only show ongoing events for which the student is registered
  const registeredEventIds = allRegistrations.map(
    (registration) => registration.eventId
  );

  const events = ongoingEvents.filter((event) =>
    registeredEventIds.includes(event.id)
  );

  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleClose = () => {
    setSelectedEvent(null);
  };

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>Ongoing Events</h1>
          <p>Participate in events that are currently active.</p>
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
            title="No Registered Ongoing Events"
            message="Your registered events that are currently active will appear here."
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

              <QRAttendance event={selectedEvent} />
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

export default OngoingEvents;