import "./UpcomingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import { getUpcomingEvents } from "../services/studentService";
import { useState } from "react";
function UpcomingEvents() {
  const events = getUpcomingEvents();
  const [selectedEvent, setSelectedEvent] = useState(null);
const [registered, setRegistered] = useState({});
const handleViewEvent = (event) => {
  setSelectedEvent(event);
};

const handleRegister = (event) => {
  setRegistered((previous) => ({
    ...previous,
    [event.id]: true,
  }));

  alert("Event registered successfully!");
};

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>Upcoming Events</h1>
          <p>Discover upcoming TCF events and register to participate.</p>
        </div>

        <div className="upcoming-events-section">
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
      />
    ))}
  </div>
) : (
  <EmptyState
    title="No Upcoming Events"
    message="There are no upcoming events available at the moment."
  />
)}
        </div>
      </div>
    </StudentLayout>
  );
}

export default UpcomingEvents;