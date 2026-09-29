import React, { useState } from "react";
import "./StudentNavbar.css";
import { Link, useNavigate } from "react-router-dom";
import {
  getActiveStudentId,
  getStudentProfile,
  getStudentNotifications,
} from "../services/studentService";

function StudentNavbar({ onToggleSidebar }) {
  const navigate = useNavigate();
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    fullName: "Jeny Thesiya",
    department: "IT",
  };

  const notifications = getStudentNotifications(studentId);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/upcoming-events?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="student-navbar">
      <div className="navbar-left">
        {/* Hamburger Toggle Button (shown on smaller screens) */}
        <button
          type="button"
          className="hamburger-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Menu"
          title="Open Menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        <form className="search-box" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search upcoming events, resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>

      <div className="navbar-right">
        <Link
          to="/notifications"
          className="notification-btn"
          title="Notifications"
          style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
        >
          <span>🔔</span>
          {unreadCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#dc2626",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: "700",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/profile"
          className="student-info"
          style={{ textDecoration: "none" }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "#6a3bc5",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {student.fullName ? student.fullName.charAt(0) : "S"}
          </div>

          <div>
            <h4>{student.fullName}</h4>
            <p>{student.department} Department</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default StudentNavbar;