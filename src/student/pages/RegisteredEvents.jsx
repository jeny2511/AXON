import "./RegisteredEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import EventCard from "../components/EventCard/EventCard";
import { getStudentRegistrations, getEventById } from "../services/studentService";

function RegisteredEvents() {
  const studentId = "ST002";
  const registrations = getStudentRegistrations(studentId);

  const registeredEvents = registrations
    .map((registration) => getEventById(registration.eventId))
    .filter(Boolean);

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="page-header">
          <h1>Registered Events</h1>
          <p>Events you have registered for.</p>
        </div>

        <div className="registered-events-section">
          {registeredEvents.length > 0 ? (
            <div className="events-grid">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  title={event.title}
                  poster={event.poster}
                  date={event.date}
                  time={event.time}
                  venue={event.venue}
                  description={event.description}
                  status={event.status}
                  buttonText="View Event"
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Registered Events"
              message="You have not registered for any events yet."
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default RegisteredEvents;