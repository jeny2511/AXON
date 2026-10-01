import { useNavigate } from "react-router-dom";
import "./pages.css";
import "./RegisteredEvents.css";
import StudentLayout from "../layouts/StudentLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import EventCard from "../components/EventCard/EventCard";
import {
  getActiveStudentId,
  getRegisteredEvents,
} from "../services/studentService";

function RegisteredEvents() {
  const navigate = useNavigate();
  const studentId = getActiveStudentId();
  const registeredEvents = getRegisteredEvents(studentId);

  return (
    <StudentLayout>
      <div className="registered-events-page">
        <div className="page-container">
          <h1 className="page-title">Registered Events</h1>
          <p className="page-subtitle">Events you have successfully registered for.</p>
        </div>

        <div className="registered-events-section">
          {registeredEvents.length > 0 ? (
            <div className="events-grid">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event.id || event.registrationId}
                  title={event.name}
                  poster={event.poster}
                  date={event.eventDate}
                  time={`${event.startTime} - ${event.endTime}`}
                  venue={event.venue}
                  description={event.description}
                  status={event.status}
                  buttonText="View in My Events"
                  onClick={() => navigate("/my-events")}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Registered Events"
              message="You have not registered for any events yet. Check out Upcoming Events to register."
            />
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default RegisteredEvents;