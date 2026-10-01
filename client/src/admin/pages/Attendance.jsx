import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

import { events, users } from "../../mockData";

function Attendance() {
  const volunteers = users.filter(
    (user) => user.role === "volunteer"
  );

  const [selectedEvent, setSelectedEvent] = useState(null);

  // Attendance data:
  // {
  //   EV001: {
  //     VL001: "Present",
  //     VL002: "Absent"
  //   }
  // }
  const [attendance, setAttendance] = useState({});

  const [submittedEvents, setSubmittedEvents] = useState({});

  // Get attendance of selected event
  const getEventAttendance = (eventId) => {
    return attendance[eventId] || {};
  };

  // Mark Present / Absent
  const markAttendance = (volunteerId, status) => {
    if (!selectedEvent) return;

    setAttendance((previous) => ({
      ...previous,

      [selectedEvent.id]: {
        ...previous[selectedEvent.id],
        [volunteerId]: status,
      },
    }));
  };

  // Select all volunteers as Present
  const handleSelectAll = () => {
    if (!selectedEvent) return;

    const allPresent = {};

    volunteers.forEach((volunteer) => {
      allPresent[volunteer.id] = "Present";
    });

    setAttendance((previous) => ({
      ...previous,
      [selectedEvent.id]: allPresent,
    }));
  };

  // Submit attendance
  const handleSubmit = () => {
    if (!selectedEvent) return;

    const eventAttendance =
      getEventAttendance(selectedEvent.id);

    setSubmittedEvents((previous) => ({
      ...previous,
      [selectedEvent.id]: true,
    }));

    alert("Attendance submitted successfully!");
  };

  // Export attendance as CSV
  const handleExport = () => {
    if (!selectedEvent) return;

    const eventAttendance =
      getEventAttendance(selectedEvent.id);

    let csv =
      "Volunteer Name,Volunteer ID,Department,Year,Attendance\n";

    volunteers.forEach((volunteer) => {
      const status =
        eventAttendance[volunteer.id] || "Not Marked";

      csv +=
        `"${volunteer.fullName}",` +
        `"${volunteer.id}",` +
        `"${volunteer.department}",` +
        `"${volunteer.year}",` +
        `"${status}"\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download =
      `${selectedEvent.id}_volunteer_attendance.csv`;

    link.click();

    URL.revokeObjectURL(url);
  };

  // Calculate attendance statistics
  const getAttendanceStats = (eventId) => {
    const eventAttendance =
      attendance[eventId] || {};

    const present = volunteers.filter(
      (volunteer) =>
        eventAttendance[volunteer.id] === "Present"
    ).length;

    const absent = volunteers.filter(
      (volunteer) =>
        eventAttendance[volunteer.id] === "Absent"
    ).length;

    const percentage =
      volunteers.length > 0
        ? Math.round(
            (present / volunteers.length) * 100
          )
        : 0;

    return {
      present,
      absent,
      percentage,
    };
  };

  return (
    <main className="dashboard attendance-page">

      {/* =========================
          PAGE HEADER
      ========================== */}

      <div className="page-heading">

        <div>
          <h2>Volunteer Attendance</h2>

          <p>
            Manage attendance of volunteers for each event
          </p>
        </div>

      </div>


      {/* =========================
          EVENT LIST
      ========================== */}

      {!selectedEvent && (

        <section className="attendance-event-section">

          <div className="attendance-section-header">

            <div>
              <h3>All Events</h3>

              <p>
                Select an event to manage volunteer attendance
              </p>
            </div>

            <span className="attendance-event-count">
              {events.length} Events
            </span>

          </div>


          <div className="attendance-event-list">

            {events.map((event) => {

              const stats =
                getAttendanceStats(event.id);

              return (

                <div
                  className="attendance-event-row"
                  key={event.id}
                  onClick={() =>
                    setSelectedEvent(event)
                  }
                >

                  {/* EVENT INFO */}

                  <div className="attendance-event-info">

                    <div className="attendance-event-icon">
                      <CalendarDays size={20} />
                    </div>

                    <div>

                      <span className="attendance-event-id">
                        {event.id}
                      </span>

                      <h3>
                        {event.name}
                      </h3>

                      <p>
                        {event.category} •{" "}
                        {event.eventDate}
                      </p>

                    </div>

                  </div>


                  {/* VOLUNTEERS */}

                  <div className="attendance-event-volunteers">

                    <Users size={17} />

                    <span>
                      {volunteers.length} Volunteers
                    </span>

                  </div>


                  {/* ATTENDANCE */}

                  <div className="attendance-event-summary">

                    <span>
                      {stats.present} Present
                    </span>

                    <span>
                      {stats.absent} Absent
                    </span>

                  </div>


                  {/* ACTION */}

                  <div className="attendance-event-action">

                    <strong>
                      View Attendance →
                    </strong>

                  </div>

                </div>

              );
            })}

          </div>

        </section>

      )}


      {/* =========================
          SELECTED EVENT
      ========================== */}

      {selectedEvent && (

        <section className="selected-attendance-section">

          {/* BACK */}

          <button
            className="back-attendance-button"
            onClick={() =>
              setSelectedEvent(null)
            }
          >
            <ArrowLeft size={16} />
            Back to Events
          </button>


          {/* EVENT HEADER */}

          <div className="selected-attendance-header">

            <div>

              <span className="attendance-event-id">
                {selectedEvent.id}
              </span>

              <h3>
                {selectedEvent.name}
              </h3>

              <p>
                {selectedEvent.category} •{" "}
                {selectedEvent.eventDate}
              </p>

            </div>


            <div className="attendance-header-stats">

              <div>
                <Users size={16} />
                <span>
                  {volunteers.length} Volunteers
                </span>
              </div>

              <div>
                <UserCheck size={16} />
                <span>
                  {
                    getAttendanceStats(
                      selectedEvent.id
                    ).present
                  } Present
                </span>
              </div>

              <div>
                <UserX size={16} />
                <span>
                  {
                    getAttendanceStats(
                      selectedEvent.id
                    ).absent
                  } Absent
                </span>
              </div>

            </div>

          </div>


          {/* =========================
              ACTION BUTTONS
          ========================== */}

          <div className="attendance-actions">

            <button
              className="secondary-attendance-button"
              onClick={handleSelectAll}
            >
              <UserCheck size={16} />
              Select All
            </button>

            <button
              className="secondary-attendance-button"
              onClick={handleExport}
            >
              <Download size={16} />
              Export File
            </button>

          </div>


          {/* =========================
              ATTENDANCE TABLE
          ========================== */}

          <div className="attendance-table-container">

            <div className="attendance-table-header">

              <div>
                <h3>
                  Volunteer Attendance
                </h3>

                <p>
                  Mark each volunteer as Present or Absent
                </p>
              </div>

              {submittedEvents[selectedEvent.id] && (

                <span className="attendance-submitted-badge">
                  <CheckCircle2 size={15} />
                  Submitted
                </span>

              )}

            </div>


            <div className="attendance-table">

              {/* TABLE HEADER */}

              <div className="attendance-table-row attendance-table-heading">

                <div>
                  Volunteer
                </div>

                <div>
                  ID
                </div>

                <div>
                  Branch
                </div>

                <div>
                  Year
                </div>

                <div>
                  Attendance
                </div>

              </div>


              {/* VOLUNTEERS */}

              {volunteers.map((volunteer) => {

                const currentStatus =
                  getEventAttendance(
                    selectedEvent.id
                  )[volunteer.id];

                return (

                  <div
                    className="attendance-table-row"
                    key={volunteer.id}
                  >

                    {/* VOLUNTEER */}

                    <div className="attendance-volunteer">

                      <div className="attendance-avatar">

                        {volunteer.fullName
                          .charAt(0)}

                      </div>

                      <strong>
                        {volunteer.fullName}
                      </strong>

                    </div>


                    {/* ID */}

                    <div className="attendance-id">
                      {volunteer.id}
                    </div>


                    {/* BRANCH */}

                    <div>
                      {volunteer.department}
                    </div>


                    {/* YEAR */}

                    <div>
                      Year {volunteer.year}
                    </div>


                    {/* STATUS */}

                    <div className="attendance-status-buttons">

                      <button
                        className={
                          currentStatus === "Present"
                            ? "attendance-status-button present active"
                            : "attendance-status-button present"
                        }
                        onClick={() =>
                          markAttendance(
                            volunteer.id,
                            "Present"
                          )
                        }
                      >
                        <UserCheck size={14} />
                        Present
                      </button>

                      <button
                        className={
                          currentStatus === "Absent"
                            ? "attendance-status-button absent active"
                            : "attendance-status-button absent"
                        }
                        onClick={() =>
                          markAttendance(
                            volunteer.id,
                            "Absent"
                          )
                        }
                      >
                        <UserX size={14} />
                        Absent
                      </button>

                    </div>

                  </div>

                );

              })}

            </div>

          </div>


          {/* =========================
              SUBMIT
          ========================== */}

          <div className="attendance-submit-section">

            <div>

              <strong>
                Ready to submit?
              </strong>

              <p>
                Make sure every volunteer has an attendance status.
              </p>

            </div>

            <button
              className="primary-button attendance-submit-button"
              onClick={handleSubmit}
            >
              <CheckCircle2 size={17} />
              Submit Attendance
            </button>

          </div>

        </section>

      )}

    </main>
  );
}

export default Attendance;