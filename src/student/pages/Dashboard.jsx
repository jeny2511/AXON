import StudentLayout from "../layouts/StudentLayout";
import EventCard from "../components/EventCard/EventCard";
import StatsCard from "../components/StatsCard/StatsCard";

import {
  getDashboardStats,
  getNearestUpcomingEvent,
} from "../services/studentService";

import "./Dashboard.css";

function Dashboard() {
  const studentId = "ST001";

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
            title="Completed Events"
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
            />
          ) : (
            <p>No upcoming events available.</p>
          )}

        </div>

      </div>

    </StudentLayout>
  );
}

export default Dashboard;