import { useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
  GraduationCap,
  ClipboardCheck,
  MessageSquareText,
  ArrowUpRight,
  UserRoundPlus,
  ListTodo,
} from "lucide-react";
import { Link } from "react-router-dom";

import StatCard from "../components/StatCard";
import UpcomingEvents from "../components/UpcomingEvents";
import { adminService } from "../../services/adminService";

function Dashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalVolunteers: 0,
    attendanceRate: 0,
    totalFeedback: 0,
    totalStudents: 0,
    totalRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        setLoading(true);
        const res = await adminService.getDashboardStats();
        if (isMounted && res) {
          const d = res.data || res;
          setStats({
            totalEvents: d.totalEvents || 0,
            upcomingEvents: d.upcomingEvents || 0,
            totalVolunteers: d.totalVolunteers || 0,
            attendanceRate: d.attendanceRate || 0,
            totalFeedback: d.totalFeedback || 0,
            totalStudents: d.totalStudents || 0,
            totalRegistrations: d.totalRegistrations || 0,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to load admin dashboard stats from API:", err.message);
      }

      if (isMounted) setLoading(false);
    }

    loadStats();
    return () => {
      isMounted = false;
    };
  }, []);

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
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Registered participants"
          icon={GraduationCap}
        />

        <StatCard
          title="Total Volunteers"
          value={stats.totalVolunteers}
          subtitle="Registered & active"
          icon={Users}
        />

        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          subtitle={`${stats.upcomingEvents} active / upcoming`}
          icon={CalendarDays}
        />

        <StatCard
          title="Total Feedback"
          value={stats.totalFeedback}
          subtitle="Student reviews received"
          icon={MessageSquareText}
        />

        <StatCard
          title="Average Attendance"
          value={`${stats.attendanceRate}%`}
          subtitle="Verified check-in rate"
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

          <div className="quick-access-list">

            <Link to="/admin/events" className="quick-access-card">
              <div className="quick-access-icon">
                <CalendarDays size={20} />
              </div>

              <div className="quick-access-info">
                <h4>Manage Events</h4>
                <p>Create, update and track status of events</p>
              </div>

              <ArrowUpRight size={18} className="quick-access-arrow" />
            </Link>

            <Link to="/admin/volunteers" className="quick-access-card">
              <div className="quick-access-icon">
                <Users size={20} />
              </div>

              <div className="quick-access-info">
                <h4>Volunteers Directory</h4>
                <p>View committee members and active volunteers</p>
              </div>

              <ArrowUpRight size={18} className="quick-access-arrow" />
            </Link>

            <Link to="/admin/task-progress" className="quick-access-card">
              <div className="quick-access-icon">
                <ListTodo size={20} />
              </div>

              <div className="quick-access-info">
                <h4>Task Progress</h4>
                <p>Assign and monitor volunteer duties</p>
              </div>

              <ArrowUpRight size={18} className="quick-access-arrow" />
            </Link>

            <Link to="/admin/attendance" className="quick-access-card">
              <div className="quick-access-icon">
                <ClipboardCheck size={20} />
              </div>

              <div className="quick-access-info">
                <h4>Attendance Records</h4>
                <p>Monitor real-time participant attendance</p>
              </div>

              <ArrowUpRight size={18} className="quick-access-arrow" />
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Dashboard;