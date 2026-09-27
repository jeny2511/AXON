import React from "react";
import "./StudentLayout.css";

import StudentSidebar from "./StudentSidebar";
import StudentNavbar from "./StudentNavbar";

function StudentLayout({ children }) {
  return (
    <div className="student-layout">

      <StudentSidebar />

      <div className="layout-content">

        <StudentNavbar />

        <div className="page-content">
          {children}
        </div>

      </div>

    </div>
  );
}

export default StudentLayout;