import { Menu, Search, Bell } from "lucide-react";
import { users } from "../../mockData";

function Topbar({ onMenuClick }) {
  const volunteer = users.find(
    (user) => user.id === "VL001"
  );

  return (
    <header className="sticky top-0 z-30 flex h-[68px] w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-5 lg:px-6">
      {/* Left section */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="flex-shrink-0 rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block w-[220px] md:w-[280px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search events, students..."
            className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-700 outline-none placeholder:text-gray-400 focus:border-purple-400"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="ml-auto flex flex-shrink-0 items-center gap-3 sm:gap-4">
        {/* Notification */}
        <button className="relative rounded-md p-1.5 text-gray-500 hover:bg-gray-100">
          <Bell size={19} />

          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-700">
            {volunteer?.fullName?.charAt(0)}
          </div>

          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800">
              {volunteer?.fullName}
            </p>

            <p className="text-[10px] text-gray-400">
              Volunteer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;