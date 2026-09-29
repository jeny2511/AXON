import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function VolunteerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f9]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen lg:ml-[230px]">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default VolunteerLayout;