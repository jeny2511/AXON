import { NavLink } from "react-router-dom";
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
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-[230px] flex-col
          bg-[#211653] text-white transition-transform duration-300
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-[116px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7440d5] font-semibold">
              A
            </div>

            <div>
              <h1 className="text-[17px] font-semibold">AXON</h1>
              <p className="text-[10px] text-purple-200">
                Volunteer Portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Volunteer profile */}
        <div className="mx-3 mb-5 rounded-lg bg-[#332568] px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm text-purple-700">
              P
            </div>

            <div>
              <p className="text-sm font-medium">Preyas Shah</p>
              <p className="text-[10px] text-purple-200">
                Volunteer
              </p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="px-3">
          <p className="mb-3 px-3 text-[9px] font-medium tracking-[1.5px] text-purple-300">
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
                    `flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] transition ${
                      isActive
                        ? "bg-[#7040d0] text-white"
                        : "text-purple-100 hover:bg-[#302263]"
                    }`
                  }
                >
                  <Icon size={17} strokeWidth={1.8} />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="mt-auto px-3 pb-5">
          <div className="mb-3 border-t border-purple-900" />

          <NavLink
            to="/volunteer/profile"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] ${
                isActive
                  ? "bg-[#7040d0] text-white"
                  : "text-purple-100 hover:bg-[#302263]"
              }`
            }
          >
            <User size={17} strokeWidth={1.8} />
            Profile
          </NavLink>

          <button className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[12px] text-purple-100 hover:bg-[#302263]">
            <LogOut size={17} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;