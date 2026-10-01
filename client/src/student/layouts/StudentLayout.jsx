import React, { useState } from "react";
import "./StudentLayout.css";

import StudentSidebar from "./StudentSidebar";
import StudentNavbar from "./StudentNavbar";

function StudentLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="student-layout">
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <StudentSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="layout-content">
        <StudentNavbar onToggleSidebar={toggleSidebar} />

        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default StudentLayout;