import React from "react";
import "./StudentSidebar.css";
import { Link } from "react-router-dom";
import { NavLink } from "react-router-dom";

function StudentSidebar() {

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: "🏠" },
  { name: "Profile", path: "/profile", icon: "👤" },
  { name: "Upcoming Events", path: "/upcoming-events", icon: "📅" },
  { name: "Registered Events", path: "/registered-events", icon: "📝" },
  { name: "My Events", path: "/my-events", icon: "✅" },
  { name: "Ongoing Events", path: "/ongoing-events", icon: "⏳" },
  { name: "Event Gallery", path: "/gallery", icon: "🖼️" },
  { name: "Learning Hub", path: "/learning-hub", icon: "📰" },
  { name: "About TCF", path: "/about-tcf", icon: "ℹ️" },
  { name: "Notifications", path: "/notifications", icon: "🔔" },
];

  // Temporary active page
  const activePage = "Dashboard";

  return (
    <div className="student-sidebar">

      {/* ---------- Logo ---------- */}

      <div className="sidebar-logo">
        <div className="logo-circle">A</div>

        <div>
          <h2>AXON</h2>
          <p>Student Portal</p>
        </div>
      </div>

      {/* ---------- Navigation ---------- */}

      <div className="sidebar-menu">

        <p className="menu-heading">MAIN MENU</p>

{menuItems.map((item) => (
<NavLink
  key={item.name}
  to={item.path}
  className={({ isActive }) =>
    isActive ? "menu-item active-menu" : "menu-item"
  }
>
  <span className="menu-icon">{item.icon}</span>
  <span className="menu-text">{item.name}</span>
</NavLink>
))}

      </div>

    </div>
  );
}

export default StudentSidebar;