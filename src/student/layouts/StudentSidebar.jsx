import React from "react";
import "./StudentSidebar.css";
import { NavLink } from "react-router-dom";

function StudentSidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Upcoming Events", path: "/upcoming-events" },
    { name: "Registered Events", path: "/registered-events" },
    { name: "My Events", path: "/my-events" },
    { name: "Ongoing Events", path: "/ongoing-events" },
    { name: "Event Gallery", path: "/gallery" },
    { name: "Learning Hub", path: "/learning-hub" },
    { name: "About TCF", path: "/about-tcf" },
    { name: "Notifications", path: "/notifications" },
  ];

  return (
    <aside className="student-sidebar">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-box">A</div>

        <div>
          <h2>AXON</h2>
          <p>Student Portal</p>
        </div>
      </div>

      {/* Clickable Student Profile */}
      <NavLink to="/profile" className="sidebar-profile">
        <div className="profile-avatar">J</div>

        <div className="sidebar-profile-details">
          <h4>Jeny Thesiya</h4>
          <p>IT Department</p>
        </div>
      </NavLink>

      {/* Navigation */}
      <nav className="sidebar-menu">
        <p className="menu-heading">MAIN MENU</p>

        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
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
        <button className="bottom-item logout-btn">
          Logout
        </button>
      </div>

    </aside>
  );
}

export default StudentSidebar;