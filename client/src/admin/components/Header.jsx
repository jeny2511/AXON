import { Menu } from "lucide-react";

function Header({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] w-full items-center justify-end border-b border-gray-200 bg-white px-4 sm:px-5 lg:px-6">

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

    </header>
  );
}

export default Header;

