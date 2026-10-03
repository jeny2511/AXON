import { useEffect, useState } from "react";
import { CalendarDays, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { eventService } from "../../services/eventService";

function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    eventService.getEvents({ tab: "upcoming" })
      .then((res) => {
        if (mounted) setEvents((res.data || []).slice(0, 5));
      })
      .catch((err) => {
        console.error("Failed to load upcoming events for admin dashboard:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="panel upcoming-panel">
      <div className="panel-header">
        <div>
          <h3>Upcoming Events</h3>
          <p>Events scheduled for the upcoming days</p>
        </div>

        <Link to="/admin/events" className="view-all">
          View All
          <ArrowRight size={15} />
        </Link>
      </div>

      <div className="event-list">
        {loading ? (
          <div style={{ padding: "16px", color: "#888", textAlign: "center" }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ padding: "16px", color: "#888", textAlign: "center" }}>No upcoming events.</div>
        ) : (
          events.map((event) => (
            <div className="event-row" key={event.id || event._id}>
              <div className="event-icon">
                <CalendarDays size={18} />
              </div>

              <div className="event-info">
                <strong>{event.name}</strong>

                <div className="event-meta">
                  <span>
                    <CalendarDays size={13} />
                    {event.eventDate}
                  </span>

                  <span>
                    <Clock size={13} />
                    {event.startTime}
                  </span>
                </div>
              </div>

              <div className="event-participants">
                <strong>{event.registeredCount || 0}</strong>
                <span>Registered</span>
              </div>

              <span className={`status ${event.status || "upcoming"}`}>{event.status || "Upcoming"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UpcomingEvents;