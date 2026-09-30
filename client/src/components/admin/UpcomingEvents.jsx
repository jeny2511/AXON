import { CalendarDays, Clock, ArrowRight } from "lucide-react";

const events = [
  {
    name: "Web Development Workshop",
    date: "15 Sep 2026",
    time: "10:00 AM",
    participants: 78,
    status: "Upcoming",
  },
  {
    name: "Cybersecurity Awareness Session",
    date: "22 Sep 2026",
    time: "02:00 PM",
    participants: 64,
    status: "Upcoming",
  },
  {
    name: "Capture The Flag (CTF)",
    date: "08 Oct 2026",
    time: "09:00 AM",
    participants: 52,
    status: "Upcoming",
  },
];

function UpcomingEvents() {
  return (
    <div className="panel upcoming-panel">
      <div className="panel-header">
        <div>
          <h3>Upcoming Events</h3>
          <p>Events scheduled for the upcoming days</p>
        </div>

        <button className="view-all">
          View All
          <ArrowRight size={15} />
        </button>
      </div>

      <div className="event-list">
        {events.map((event) => (
          <div className="event-row" key={event.name}>
            <div className="event-icon">
              <CalendarDays size={18} />
            </div>

            <div className="event-info">
              <strong>{event.name}</strong>

              <div className="event-meta">
                <span>
                  <CalendarDays size={13} />
                  {event.date}
                </span>

                <span>
                  <Clock size={13} />
                  {event.time}
                </span>
              </div>
            </div>

            <div className="event-participants">
              <strong>{event.participants}</strong>
              <span>Registered</span>
            </div>

            <span className="status upcoming">{event.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default UpcomingEvents;