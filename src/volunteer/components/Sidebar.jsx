import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  ClipboardCheck,
  BarChart2,
  MessageSquare,
  Images,
  CheckSquare,
  FileText,
  UserPlus,
  User,
  LogOut,
  X,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    path: "/volunteer",
    icon: LayoutDashboard,
  },
  {
    name: "Events",
    path: "/volunteer/events",
    icon: CalendarDays,
  },
  {
    name: "Volunteers",
    path: "/volunteer/volunteers",
    icon: Users,
  },
  {
    name: "Participants",
    path: "/volunteer/registrations",
    icon: UserCheck,
  },
  {
    name: "Attendance",
    path: "/volunteer/presence",
    icon: ClipboardCheck,
  },
  {
    name: "Analysis",
    path: "/volunteer/analysis",
    icon: BarChart2,
  },
  {
    name: "Feedback",
    path: "/volunteer/feedback",
    icon: MessageSquare,
  },
  {
    name: "Gallery",
    path: "/volunteer/gallery",
    icon: Images,
  },
  {
    name: "Task Progress",
    path: "/volunteer/tasks",
    icon: CheckSquare,
  },
  {
    name: "Reports",
    path: "/volunteer/reports",
    icon: FileText,
  },
  {
    name: "Add Volunteer",
    path: "/volunteer/add-volunteer",
    icon: UserPlus,
  },
];

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[240px]
          flex-col bg-[#19143c] text-white
          transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo Header */}
        <div className="flex h-20 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#635bff] text-base font-bold text-white shadow-sm">
              A
            </div>

            <div>
              <h1 className="text-base font-bold tracking-wide text-white leading-tight">
                AXON
              </h1>
              <p className="text-[11px] text-purple-200/70">
                Admin Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-purple-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="mx-3.5 mb-4 rounded-xl bg-[#231b52] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-[#19143c]">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white leading-tight">
                Admin
              </p>
              <p className="text-[10px] text-purple-200/70">
                Administrator
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3.5 scrollbar-thin">
          <p className="mb-2 px-2 text-[10px] font-semibold tracking-wider text-purple-300/50 uppercase">
            MAIN MENU
          </p>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === "/volunteer"}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#635bff] text-white shadow-sm"
                        : "text-purple-200/75 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={2} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Menu */}
        <div className="border-t border-white/5 p-3.5">
          <NavLink
            to="/volunteer/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#635bff] text-white"
                  : "text-purple-200/75 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <User size={17} strokeWidth={2} />
            <span>Profile</span>
          </NavLink>

          <button className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-purple-200/75 transition-colors hover:bg-white/5 hover:text-white">
            <LogOut size={17} strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;