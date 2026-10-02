import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  MessageSquare,
  Images,
  FileText,
  Award,
  ListChecks,
  UserCheck,
  BookOpen,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";

import { users } from "../../mockData";
import { logout } from "../../services/authService";

const menuItems = [
  {
    name: "Dashboard",
    path: "/volunteer",
    icon: LayoutDashboard,
  },
  {
    name: "Manage Events",
    path: "/volunteer/events",
    icon: CalendarDays,
  },
  {
    name: "Registrations",
    path: "/volunteer/registrations",
    icon: ClipboardList,
  },
  {
    name: "Feedback Form",
    path: "/volunteer/feedback",
    icon: MessageSquare,
  },
  {
    name: "Event Gallery",
    path: "/volunteer/gallery",
    icon: Images,
  },
  {
    name: "Reports",
    path: "/volunteer/reports",
    icon: FileText,
  },
  {
    name: "Certificates",
    path: "/volunteer/certificates",
    icon: Award,
  },
  {
    name: "Tasks",
    path: "/volunteer/tasks",
    icon: ListChecks,
  },
  {
    name: "My Presence",
    path: "/volunteer/presence",
    icon: UserCheck,
  },
  {
    name: "Learning Hub",
    path: "/volunteer/learning",
    icon: BookOpen,
  },
  {
    name: "Notifications",
    path: "/volunteer/notifications",
    icon: Bell,
  },
];

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
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

        <div className="flex h-[100px] items-center justify-between px-5">
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
                Volunteer Portal
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-purple-100 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* -------------------------------- */}
        {/* Volunteer Profile */}
        {/* -------------------------------- */}

        {(() => {
          let currentVolunteer = null;
          try {
            const stored = localStorage.getItem("axon_volunteer_user");
            if (stored) {
              const parsed = JSON.parse(stored);
              currentVolunteer = users.find(
                (u) => u.id === parsed.id || u.enrollmentNo === parsed.enrollmentNo
              );
            }
          } catch (e) {}

          if (!currentVolunteer) {
            currentVolunteer =
              users.find((u) => u.id === "VL002") ||
              users.find((u) => u.role === "volunteer");
          }

          const name = currentVolunteer?.fullName || "Dhruvi Patel";
          const initial = name[0] || "D";
          const designation = currentVolunteer?.designation || "President";

          return (
            <div className="mx-3 mb-4 rounded-lg bg-[#332568] px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                  {initial}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {name}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-purple-200">
                    Volunteer · {designation}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* -------------------------------- */}
        {/* Main Menu */}
        {/* -------------------------------- */}

        <div className="px-3">
          <p className="mb-2 px-3 text-[9px] font-medium tracking-[1.5px] text-purple-300">
            MAIN MENU
          </p>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/volunteer"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3
                    rounded-md
                    px-3 py-2.5
                    text-[12px]
                    transition-colors
                    ${
                      isActive
                        ? "bg-[#7040d0] text-white"
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

                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* -------------------------------- */}
        {/* Bottom Menu */}
        {/* -------------------------------- */}

        <div className="mt-auto px-3 pb-4">
          <div className="mb-2 border-t border-purple-900" />

          {/* Profile */}
          <NavLink
            to="/volunteer/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `
              flex items-center gap-3
              rounded-md
              px-3 py-2.5
              text-[12px]
              transition-colors
              ${
                isActive
                  ? "bg-[#7040d0] text-white"
                  : "text-purple-100 hover:bg-[#302263]"
              }
              `
            }
          >
            <User size={17} strokeWidth={1.8} />

            <span>Profile</span>
          </NavLink>

          {/* Logout */}
          <button
            type="button"
            onClick={() => {
              logout();
              if (onClose) onClose();
              navigate("/login");
            }}
            className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[12px] text-purple-100 transition-colors hover:bg-[#302263]"
          >
            <LogOut size={17} strokeWidth={1.8} />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;