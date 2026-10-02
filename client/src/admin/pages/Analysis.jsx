import {
  BarChart3,
  CalendarDays,
  MessageSquareText,
  Users,
} from "lucide-react";

import {
  events,
  users,
  registrations,
  feedback,
} from "../../mockData";

function Analysis() {
  // -----------------------------
  // BASIC COUNTS
  // -----------------------------

  const totalRegistrations = registrations.filter(
    (registration) => registration.status === "registered"
  ).length;

  const totalEvents = events.length;

  // Average participation
  const averageParticipation =
    events.length > 0
      ? Math.round(
          events.reduce((total, event) => {
            const percentage =
              event.participantLimit > 0
                ? (event.registeredCount / event.participantLimit) * 100
                : 0;

            return total + percentage;
          }, 0) / events.length
        )
      : 0;

  // -----------------------------
  // RECENT 5 EVENTS
  // -----------------------------

  const recentEvents = [...events]
    .sort(
      (a, b) =>
        new Date(b.eventDate) - new Date(a.eventDate)
    )
    .slice(0, 5);

  // Feedback average for each recent event
  const feedbackData = recentEvents.map((event) => {
    const eventFeedback = feedback.filter(
      (item) => item.eventId === event.id
    );

    const average =
      eventFeedback.length > 0
        ? eventFeedback.reduce(
            (sum, item) =>
              sum + Number(
                item.overallRating ?? item.rating ?? item.feedbackRating ?? item.ratingValue ?? 0
              ),
            0
          ) / eventFeedback.length
        : 0;

    return {
      ...event,
      averageFeedback: Number(average.toFixed(1)),
    };
  });

  // -----------------------------
  // DEPARTMENT PARTICIPATION
  // -----------------------------

  const students = users.filter(
    (user) => user.role === "student"
  );

  const departmentCounts = {};

  registrations
    .filter(
      (registration) =>
        registration.status === "registered"
    )
    .forEach((registration) => {
      const student = students.find(
        (user) => user.id === registration.studentId
      );

      if (student) {
        departmentCounts[student.department] =
          (departmentCounts[student.department] || 0) + 1;
      }
    });

  const totalDepartmentRegistrations =
    Object.values(departmentCounts).reduce(
      (sum, value) => sum + value,
      0
    );

  const departmentData = Object.entries(
    departmentCounts
  )
    .map(([department, count]) => ({
      department,
      count,
      percentage:
        totalDepartmentRegistrations > 0
          ? Math.round(
              (count / totalDepartmentRegistrations) * 100
            )
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // -----------------------------
  // HELPERS
  // -----------------------------

  const getFeedbackColor = (rating) => {
    if (rating >= 4.5) return "excellent";
    if (rating >= 3.5) return "good";
    if (rating > 0) return "average";
    return "no-feedback";
  };

  return (
    <main className="dashboard analysis-page">

      {/* PAGE HEADER */}
      <div className="page-heading analysis-heading">
        <div>
          <h2>Analytics & Insights</h2>
          <p>
            Analyze event participation and student feedback
          </p>
        </div>
      </div>

      {/* =========================================
          SUMMARY CARDS
          ========================================= */}

      <section className="analysis-stat-grid">

        <div className="analysis-stat-card">
          <div className="analysis-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>Total Registrations</span>
            <strong>{totalRegistrations}</strong>
          </div>
        </div>

        <div className="analysis-stat-card">
          <div className="analysis-stat-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Total Events</span>
            <strong>{totalEvents}</strong>
          </div>
        </div>

        <div className="analysis-stat-card">
          <div className="analysis-stat-icon">
            <BarChart3 size={20} />
          </div>

          <div>
            <span>Average Participation</span>
            <strong>{averageParticipation}%</strong>
          </div>
        </div>

      </section>

      {/* =========================================
          FEEDBACK ANALYSIS
          ========================================= */}

      <section className="analysis-panel feedback-panel">

        <div className="analysis-panel-header">
          <div>
            <h3>Recent 5 Events — Feedback Analysis</h3>
            <p>
              Average feedback rating for the latest events
            </p>
          </div>

          <MessageSquareText size={20} />
        </div>

        <div className="feedback-chart">

          <div className="feedback-y-axis">
            <span>5</span>
            <span>4</span>
            <span>3</span>
            <span>2</span>
            <span>1</span>
          </div>

          <div className="feedback-chart-area">

            <div className="feedback-grid-lines">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="feedback-bars">

              {feedbackData.map((event) => {
                const height =
                  event.averageFeedback > 0
                    ? (event.averageFeedback / 5) * 100
                    : 4;

                return (
                  <div
                    className="feedback-bar-column"
                    key={event.id}
                  >
                    <div className="feedback-value">
                      {event.averageFeedback > 0
                        ? event.averageFeedback
                        : "N/A"}
                    </div>

                    <div className="feedback-bar-wrapper">

                      <div
                        className={`feedback-bar ${getFeedbackColor(
                          event.averageFeedback
                        )}`}
                        style={{
                          height: `${height}%`,
                        }}
                      ></div>

                    </div>

                    <span className="feedback-event-name">
                      {event.name}
                    </span>
                  </div>
                );
              })}

            </div>
          </div>
        </div>

        <div className="feedback-scale">
          <span>1</span>
          <span>Very Poor</span>
          <span>3</span>
          <span>Average</span>
          <span>5</span>
          <span>Excellent</span>
        </div>

      </section>

      {/* =========================================
          DEPARTMENT PARTICIPATION
          ========================================= */}

      <section className="analysis-panel department-panel">

        <div className="analysis-panel-header">
          <div>
            <h3>Department Participation</h3>
            <p>
              Student participation based on registrations
            </p>
          </div>

          <Users size={20} />
        </div>

        <div className="department-content">

          <div className="department-chart">
            <div
              className="department-donut"
              style={{
                background: `conic-gradient(
                  #6538bd 0% 48%,
                  #8c63d8 48% 76%,
                  #b79be9 76% 93%,
                  #d9c9f4 93% 100%
                )`,
              }}
            >
              <div className="department-donut-center">
                <strong>
                  {totalDepartmentRegistrations}
                </strong>
                <span>Students</span>
              </div>
            </div>
          </div>

          <div className="department-list">

            {departmentData.map((item, index) => (
              <div
                className="department-item"
                key={item.department}
              >

                <div className="department-item-top">

                  <div className="department-name">
                    <span
                      className={`department-dot dot-${index}`}
                    ></span>

                    <strong>{item.department}</strong>
                  </div>

                  <span>
                    {item.percentage}%
                  </span>

                </div>

                <div className="department-track">
                  <div
                    className={`department-fill fill-${index}`}
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  ></div>
                </div>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* =========================================
          EVENT PERFORMANCE LIST
          ========================================= */}

      <section className="analysis-panel event-performance-panel">

        <div className="analysis-panel-header">
          <div>
            <h3>Event Performance</h3>
            <p>
              Registration and participation for all events
            </p>
          </div>

          <CalendarDays size={20} />
        </div>

        <div className="event-performance-list">

          {events.map((event) => {

            const participation =
              event.participantLimit > 0
                ? Math.round(
                    (event.registeredCount /
                      event.participantLimit) *
                      100
                  )
                : 0;

            return (
              <div
                className="event-performance-item"
                key={event.id}
              >

                <div className="event-performance-main">

                  <div className="event-performance-icon">
                    <CalendarDays size={17} />
                  </div>

                  <div>
                    <h4>{event.name}</h4>

                    <span>
                      {event.id} • {event.category}
                    </span>
                  </div>

                </div>

                <div className="event-performance-stat">
                  <span>Registrations</span>
                  <strong>
                    {event.registeredCount}
                  </strong>
                </div>

                <div className="event-performance-stat participation-stat">
                  <span>Participation</span>

                  <strong>
                    {participation}%
                  </strong>
                </div>

              </div>
            );
          })}

        </div>

      </section>

    </main>
  );
}

export default Analysis;
