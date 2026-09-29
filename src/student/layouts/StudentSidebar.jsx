import React from "react";
import "./StudentSidebar.css";
import { NavLink } from "react-router-dom";
import { getActiveStudentId, getStudentProfile } from "../services/studentService";

function StudentSidebar({ isOpen, onClose }) {
  const studentId = getActiveStudentId();
  const student = getStudentProfile(studentId) || {
    fullName: "Jeny Thesiya",
    department: "IT",
  };

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
    if (window.confirm("Are you sure you want to log out of AXON?")) {
      // In frontend demo, confirm and redirect to dashboard
      window.location.href = "/dashboard";
    }
  };

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const avatarInitial = student.fullName ? student.fullName.charAt(0) : "S";

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
          <h4>{student.fullName}</h4>
          <p>{student.department} Department</p>
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

      {/* Logout */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="bottom-item logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}

export default StudentSidebar;