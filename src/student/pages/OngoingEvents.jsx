import "./OngoingEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import EmptyState from "../components/EmptyState/EmptyState";
import { getOngoingEvents } from "../services/studentService";

function OngoingEvents() {
  const events = getOngoingEvents();

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>Ongoing Events</h1>
          <p>View events that are currently active.</p>
        </div>

        <div className="ongoing-events-section">
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
    title="No Ongoing Events"
    message="There are no ongoing events at the moment."
  />
)}
        </div>
      </div>
    </StudentLayout>
  );
}

export default OngoingEvents;