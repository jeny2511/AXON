import { useState } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function VolunteerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f9]">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main application area */}
      <div className="min-h-screen lg:ml-[230px]">

        {/* Topbar */}
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Page area */}
        <main className="min-h-[calc(100vh-68px)] p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>

      </div>
    </div>
  );
}

export default VolunteerLayout;