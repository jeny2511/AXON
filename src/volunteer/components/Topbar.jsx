import { Menu } from "lucide-react";

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-5 lg:px-6">
      
      {/* -------------------------------- */}
      {/* Left Section */}
      {/* -------------------------------- */}

      <div className="flex min-w-0 items-center gap-3">
        
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

      </div>

      {/* -------------------------------- */}
      {/* Right Section */}
      {/* -------------------------------- */}

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
      </div>

    </header>
  );
}

export default Topbar;