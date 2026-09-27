import React from "react";
import "./StudentNavbar.css";

function StudentNavbar() {
  return (
    <div className="student-navbar">

      <div className="search-box">
        <input
          type="text"
          placeholder="Search events, resources..."
        />
      </div>

      <div className="navbar-right">

        <button className="notification-btn">
          🔔
        </button>

        <div className="student-info">
          <img
            src="https://i.pravatar.cc/100?img=32"
            alt="Student"
          />

          <div>
            <h4>Jeny Thesiya</h4>
            <p>IT Department</p>
          </div>
        </div>

      </div>

    </div>
  );
}

export default StudentNavbar;