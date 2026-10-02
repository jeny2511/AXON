import React, { useState } from "react";
import StudentSidebar from "./StudentSidebar";
import StudentNavbar from "./StudentNavbar";

function StudentLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f7f9]">
      {/* Sidebar */}
      <StudentSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main application area */}
      <div className="min-h-screen lg:ml-[230px]">
        {/* Topbar */}
        <StudentNavbar
          onMenuClick={() => setSidebarOpen(true)}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        {/* Page area */}
        <main className="min-h-[calc(100vh-68px)] p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;