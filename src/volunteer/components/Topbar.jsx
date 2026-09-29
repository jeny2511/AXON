import { Menu, Search, Bell } from "lucide-react";
import { users } from "../../mockData";

function Topbar({ onMenuClick }) {
  const volunteer = users.find(
    (user) => user.id === "VL001"
  );

  return (
    <header className="flex h-[68px] items-center justify-between border-b border-gray-200 bg-white px-5 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="text-gray-600 lg:hidden"
        >
          <Menu size={22} />
        </button>

        {/* Search */}
        <div className="relative w-[280px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search events, students..."
            className="h-9 w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-500">
          <Bell size={19} />

          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

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