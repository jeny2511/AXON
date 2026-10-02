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
  UserCircle,
  LogOut,
  X,
} from "lucide-react";
import { logout, getAuthUser } from "../../services/authService";
import { users } from "../../mockData";

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
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onClose) onClose();
    navigate("/login");
  };

  const adminUser = (() => {
    const authUser = getAuthUser();
    if (authUser && authUser.role === "admin") return authUser;
    try {
      const stored = localStorage.getItem("axon_auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === "admin") return parsed;
      }
    } catch {}
    return users.find((u) => u.role === "admin") || {
      fullName: "Ishika Patel",
      name: "Ishika Patel",
      role: "admin",
    };
  })();

  const adminName = adminUser?.fullName || adminUser?.name || "Admin";
  const adminInitial = adminName ? adminName[0].toUpperCase() : "A";

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen
          w-[280px] flex-col
          bg-[#211653] text-white
          transition-transform duration-300
          lg:w-[230px]
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* -------------------------------- */}
        {/* Logo */}
        {/* -------------------------------- */}
        <div className="flex h-[90px] shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {/* AXON icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7440d5] text-sm font-semibold">
              A
            </div>

            {/* AXON name */}
            <div>
              <h1 className="text-[18px] font-semibold leading-none">
                AXON
              </h1>

              <p className="mt-1 text-[10px] text-purple-200">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-purple-100 hover:bg-white/10 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* -------------------------------- */}
        {/* Admin Profile Card */}
        {/* -------------------------------- */}
        <div className="mx-3 mb-3 shrink-0 rounded-lg bg-[#332568] px-3 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
              {adminInitial}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white">
                {adminName}
              </p>

              <p className="mt-0.5 truncate text-[10px] text-purple-200">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* -------------------------------- */}
        {/* Main Navigation Menu */}
        {/* -------------------------------- */}
        <div className="flex-1 overflow-y-auto px-3 scrollbar-none">
          <p className="mb-2 px-3 text-[9px] font-medium tracking-[1.5px] text-purple-300">
            MAIN MENU
          </p>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.label}
                  to={item.path}
                  end={item.path === "/admin"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    rounded-md
                    px-3 py-2
                    text-[12px]
                    transition-colors
                    ${
                      isActive
                        ? "bg-[#7040d0] text-white font-medium"
                        : "text-purple-100 hover:bg-[#302263]"
                    }
                    `
                  }
                >
                  <Icon
                    size={17}
                    strokeWidth={1.8}
                    className="shrink-0"
                  />

                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* -------------------------------- */}
        {/* Bottom Navigation Menu */}
        {/* -------------------------------- */}
        <div className="mt-auto shrink-0 px-3 pb-4 pt-2">
          <div className="mb-2 border-t border-purple-900" />

          {/* Profile */}
          <NavLink
            to="/admin/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `
              flex items-center gap-3
              rounded-md
              px-3 py-2
              text-[12px]
              transition-colors
              ${
                isActive
                  ? "bg-[#7040d0] text-white font-medium"
                  : "text-purple-100 hover:bg-[#302263]"
              }
              `
            }
          >
            <UserCircle size={17} strokeWidth={1.8} className="shrink-0" />
            <span>Profile</span>
          </NavLink>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2 text-[12px] text-purple-100 transition-colors hover:bg-[#302263]"
          >
            <LogOut size={17} strokeWidth={1.8} className="shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;