import { NavLink, useNavigate } from "react-router-dom";
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
import { logout } from "../../services/authService";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Events", icon: CalendarDays, path: "/admin/events" },
  { label: "Volunteers", icon: Users, path: "/admin/volunteers" },
  { label: "Participants", icon: UserRoundCheck, path: "/admin/participants" },
  { label: "Attendance", icon: ClipboardCheck, path: "/admin/attendance" },
  { label: "Analysis", icon: BarChart3, path: "/admin/analysis" },
  { label: "Feedback", icon: MessageSquareText, path: "/admin/feedback" },
  { label: "Gallery", icon: Image, path: "/admin/gallery" },
  { label: "Task Progress", icon: ListTodo, path: "/admin/tasks" },
  { label: "Reports", icon: FileText, path: "/admin/reports" },
  { label: "Add Volunteer", icon: UserPlus, path: "/admin/add-volunteer" },
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate("/login");
  };

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
              end={item.path === "/admin"}
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
          to="/admin/profile"
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
          onClick={handleLogout}
        >
          <LogOut size={17} strokeWidth={1.8} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;