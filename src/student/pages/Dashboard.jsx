import { useNavigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import StatsCard from "../components/StatsCard/StatsCard";

import {
  getActiveStudentId,
  getDashboardStats,
  getNearestUpcomingEvent,
} from "../services/studentService";

import "./pages.css";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const studentId = getActiveStudentId();

  const stats = getDashboardStats(studentId);
  const nearestEvent = getNearestUpcomingEvent();

  return (
    <StudentLayout>
      <div className="dashboard-page">
        {/* Page Header */}
        <div className="page-container">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome to the AXON Student Dashboard.
          </p>
        </div>

        {/* Statistics */}
        <div className="stats-section">
          <StatsCard
            title="Upcoming Events"
            value={stats.upcomingEvents}
          />

          <StatsCard
            title="Registered Events"
            value={stats.registeredEvents}
          />

          <StatsCard
            title="Attended Events"
            value={stats.completedEvents}
          />

          <StatsCard
            title="Certificates"
            value={stats.certificates}
          />
        </div>

        {/* Nearest Upcoming Event */}
        <div className="dashboard-section">
          <h2 className="section-title">
            Next Upcoming Event
          </h2>

          {nearestEvent ? (
            <EventCard
              title={nearestEvent.name}
              poster={nearestEvent.poster}
              date={nearestEvent.eventDate}
              time={`${nearestEvent.startTime} - ${nearestEvent.endTime}`}
              venue={nearestEvent.venue}
              description={nearestEvent.description}
              status={nearestEvent.status}
              buttonText="View Details"
              onClick={() => navigate(`/events/${nearestEvent.id}`)}
            />
          ) : (
            <p style={{ color: "#666" }}>No upcoming events available.</p>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}

export default Dashboard;