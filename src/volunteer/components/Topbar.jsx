import { Menu, Search, Bell } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[68px] w-full items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8">
      {/* Left section: Hamburger (mobile) + Search */}
      <div className="flex flex-1 items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={22} />
        </button>

        {/* Search Input */}
        <div className="relative w-full max-w-xs sm:max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search events, volunteers, students..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#635bff] focus:ring-1 focus:ring-[#635bff]"
          />
        </div>
      </div>

      {/* Right section: Notifications + Profile */}
      <div className="ml-4 flex items-center gap-3 sm:gap-4">
        {/* Notification bell */}
        <button className="relative rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* Profile info */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-xs font-semibold text-purple-700">
            A
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-tight">
              Admin
            </p>
            <p className="text-[10px] text-gray-400 leading-tight">
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;