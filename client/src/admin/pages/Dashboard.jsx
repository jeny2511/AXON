import {
  CalendarDays,
  Users,
  ClipboardCheck,
  MessageSquareText,
  ArrowUpRight,
  UserRoundPlus,
  ListTodo,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../components/StatCard";
import UpcomingEvents from "../components/UpcomingEvents";
import { events, users } from "../../mockData";

function Dashboard() {
  const totalEvents = events.length;

  const totalVolunteers = users.filter(
    (user) => user.role === "volunteer"
  ).length;

  const upcomingEvents = events.filter(
    (event) => event.status === "upcoming"
  );

  /*
    Average feedback and attendance are currently shown
    using the existing frontend data.

    These values can later be connected to backend data.
  */
  const averageFeedback = "4.3/5";
  const averageAttendance = "82%";

  return (
    <main className="dashboard">

      {/* PAGE HEADING */}
      <div className="page-heading">
        <div>
          <h2>Dashboard</h2>
          <p>Overview of your event management system</p>
        </div>

        <Link
          to="/admin/add-volunteer"
          className="primary-button"
        >
          <UserRoundPlus size={17} />
          Add Volunteer
        </Link>
      </div>

      {/* STAT CARDS */}
      <section className="stats-grid">

        <StatCard
          title="Total Events"
          value={totalEvents}
          subtitle={`${upcomingEvents.length} upcoming events`}
          icon={CalendarDays}
        />

        <StatCard
          title="Total Volunteers"
          value={totalVolunteers}
          subtitle="Active volunteers"
          icon={Users}
        />

        <StatCard
          title="Average Feedback"
          value={averageFeedback}
          subtitle="Across completed events"
          icon={MessageSquareText}
        />

        <StatCard
          title="Average Attendance"
          value={averageAttendance}
          subtitle="Across all events"
          icon={ClipboardCheck}
        />

      </section>

      {/* UPCOMING EVENTS + QUICK ACCESS */}
      <section className="content-grid">

        {/* UPCOMING EVENTS */}
        <UpcomingEvents />

        {/* QUICK ACCESS */}
        <div className="panel activity-panel">

          <div className="panel-header">
            <div>
              <h3>Quick Access</h3>
              <p>Frequently used management sections</p>
            </div>
          </div>

          <div className="quick-access">

            {/* ATTENDANCE */}
            <Link to="/admin/attendance">
              <div className="quick-icon">
                <ClipboardCheck size={18} />
              </div>

              <div>
                <strong>Attendance</strong>
                <span>Manage volunteer attendance</span>
              </div>

              <ArrowUpRight size={16} />
            </Link>

            {/* TASK PROGRESS */}
            <Link to="/admin/tasks">
              <div className="quick-icon">
                <ListTodo size={18} />
              </div>

              <div>
                <strong>Task Progress</strong>
                <span>Manage volunteer tasks</span>
              </div>

              <ArrowUpRight size={16} />
            </Link>

            {/* VOLUNTEERS */}
            <Link to="/admin/volunteers">
              <div className="quick-icon">
                <Users size={18} />
              </div>

              <div>
                <strong>Volunteers</strong>
                <span>View volunteer information</span>
              </div>

              <ArrowUpRight size={16} />
            </Link>

          </div>
        </div>

      </section>
    </main>
  );
}

export default Dashboard;