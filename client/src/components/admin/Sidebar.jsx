import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserRoundCheck,
  ClipboardCheck,
  BarChart3,
  MessageSquareText,
  Image,
  ListTodo,
  FileText,
  UserPlus,
  UserCircle,
  LogOut,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Events", icon: CalendarDays, path: "/events" },
  { label: "Volunteers", icon: Users, path: "/volunteers" },
  { label: "Participants", icon: UserRoundCheck, path: "/participants" },
  { label: "Attendance", icon: ClipboardCheck, path: "/attendance" },
  { label: "Analysis", icon: BarChart3, path: "/analysis" },
  { label: "Feedback", icon: MessageSquareText, path: "/feedback" },
  { label: "Gallery", icon: Image, path: "/gallery" },
  { label: "Task Progress", icon: ListTodo, path: "/tasks" },
  { label: "Reports", icon: FileText, path: "/reports" },
  { label: "Add Volunteer", icon: UserPlus, path: "/add-volunteer" },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
      <div className="brand">
        <div className="brand-logo">A</div>

        <div>
          <h1>AXON</h1>
          <p>Admin Portal</p>
        </div>

        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>
      </div>

      <div className="admin-profile">
        <div className="profile-avatar">A</div>

        <div>
          <strong>Admin</strong>
          <span>Administrator</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">
          MAIN MENU
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/profile"
          onClick={onClose}
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <UserCircle size={17} strokeWidth={1.8} />
          <span>Profile</span>
        </NavLink>

        <button
          className="nav-item logout"
          onClick={onClose}
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;