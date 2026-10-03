import React, { useState, useEffect } from "react";
import "./StudentSidebar.css";
import { NavLink, useNavigate } from "react-router-dom";
import { getActiveStudentId, getStudentProfile } from "../services/studentService";
import { isLoggedIn, logoutStudent } from "../services/authService";

function StudentSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(() => isLoggedIn());
  const studentId = getActiveStudentId();
  const student = authenticated ? getStudentProfile(studentId) : null;

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthenticated(isLoggedIn());
    };
    window.addEventListener("axon-auth-change", handleAuthChange);
    return () => window.removeEventListener("axon-auth-change", handleAuthChange);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Upcoming Events", path: "/upcoming-events" },
    { name: "Registered Events", path: "/registered-events" },
    { name: "My Events", path: "/my-events" },
    { name: "Ongoing Events", path: "/ongoing-events" },
    { name: "My Certificates", path: "/certificates" },
    { name: "Event Gallery", path: "/gallery" },
    { name: "Learning Hub", path: "/learning-hub" },
    { name: "About TCF", path: "/about-tcf" },
    { name: "Notifications", path: "/notifications" },
  ];

  const handleLogout = () => {
    logoutStudent();
    if (onClose) onClose();
    navigate("/login");
  };

  const handleLoginClick = () => {
    if (onClose) onClose();
    navigate("/login");
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const avatarInitial = authenticated && student?.fullName
    ? student.fullName.charAt(0)
    : "G";

  return (
    <aside className={`student-sidebar ${isOpen ? "open" : ""}`}>
      {/* Logo & Close Button Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-box">A</div>
          <div>
            <h2>AXON</h2>
            <p>Student Portal</p>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        <button
          type="button"
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close Sidebar"
          title="Close Menu"
        >
          ✕
        </button>
      </div>

      {/* Clickable Student Profile */}
      <NavLink
        to="/profile"
        className="sidebar-profile"
        onClick={handleLinkClick}
      >
        <div className="profile-avatar">{avatarInitial}</div>

        <div className="sidebar-profile-details">
          <h4>{student?.fullName || student?.name || "Student"}</h4>
          <p>
            {student?.department
              ? `${student.department} Department`
              : "Student Portal"}
          </p>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-menu">
        <p className="menu-heading">MAIN MENU</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              isActive ? "menu-item active-menu" : "menu-item"
            }
          >
            <span className="menu-text">
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Logout / Login Action */}
      <div className="sidebar-bottom">
        {authenticated ? (
          <button
            type="button"
            className="bottom-item logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            className="bottom-item login-btn"
            onClick={handleLoginClick}
            style={{
              width: "100%",
              padding: "9px 12px",
              border: "none",
              borderRadius: "6px",
              background: "#6a3bc5",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Login / Sign Up
          </button>
        )}
      </div>
    </aside>
  );
}

export default StudentSidebar;