import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck,
  Clock,
  Award,
  Images,
  BookOpen,
  FileText,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";
import { getActiveStudentId, getStudentProfile } from "../services/studentService";
import { isLoggedIn, logoutStudent } from "../services/authService";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Upcoming Events",
    path: "/upcoming-events",
    icon: CalendarDays,
  },
  {
    name: "My Events",
    path: "/my-events",
    icon: CalendarCheck,
  },
  {
    name: "Ongoing Events",
    path: "/ongoing-events",
    icon: Clock,
  },
  {
    name: "My Certificates",
    path: "/certificates",
    icon: Award,
  },
  {
    name: "Event Gallery",
    path: "/gallery",
    icon: Images,
  },
  {
    name: "Learning Hub",
    path: "/learning-hub",
    icon: BookOpen,
  },
  {
    name: "About TCF",
    path: "/about-tcf",
    icon: FileText,
  },
  {
    name: "Notifications",
    path: "/notifications",
    icon: Bell,
  },
];

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

  const handleLogout = () => {
    logoutStudent();
    if (onClose) onClose();
    navigate("/login");
  };

  const handleLoginClick = () => {
    if (onClose) onClose();
    navigate("/login");
  };

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
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#7440d5] text-sm font-semibold text-white">
              A
            </div>

            {/* AXON name */}
            <div>
              <h1 className="text-[18px] font-semibold leading-none text-white">
                AXON
              </h1>
              <p className="mt-1 text-[10px] text-purple-200">
                Student Portal
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-purple-100 hover:bg-white/10 lg:hidden"
            aria-label="Close Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* -------------------------------- */}
        {/* Student Profile */}
        {/* -------------------------------- */}
        {(() => {
          const name = authenticated && student?.fullName ? student.fullName : "Guest User";
          const initial = name ? name[0].toUpperCase() : "G";
          const dept = authenticated && student?.department ? `${student.department} Dept` : "Student Portal";

          return (
            <NavLink
              to={authenticated ? "/profile" : "/login"}
              onClick={onClose}
              className="mx-3 mb-4 block rounded-lg bg-[#332568] px-3 py-2.5 transition-colors hover:bg-[#3d2d79]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                  {initial}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-white">
                    {name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-purple-200">
                    Student · {dept}
                  </p>
                </div>
              </div>
            </NavLink>
          );
        })()}

        {/* -------------------------------- */}
        {/* Main Menu */}
        {/* -------------------------------- */}
        <div className="flex-1 overflow-y-auto px-3">
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
                  end={item.path === "/dashboard"}
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
            to="/profile"
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

          {/* Logout / Login Action */}
          {authenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[12px] text-purple-100 transition-colors hover:bg-[#302263]"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span>Logout</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleLoginClick}
              className="mt-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[12px] text-purple-100 transition-colors hover:bg-[#302263]"
            >
              <LogOut size={17} strokeWidth={1.8} />
              <span>Login</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

export default StudentSidebar;