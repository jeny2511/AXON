import { CalendarDays, Clock, MapPin, Users } from "lucide-react";

import { events } from "../../mockData";

function Events() {
  return (
    <main className="dashboard">

      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h2>Event Management</h2>
          <p>View and manage all events</p>
        </div>

        <button className="primary-button">
          + Create Event
        </button>
      </div>

      {/* Event count */}
      <div className="event-count">
        <CalendarDays size={18} />
        <span>
          <strong>{events.length}</strong> Events
        </span>
      </div>

      {/* Event cards */}
      <section className="event-card-grid">
        {events.map((event) => (
          <div className="event-card" key={event.id}>

            {/* Poster */}
            <div className="event-poster">
              <img
                src={event.poster}
                alt={event.name}
              />

              <span
                className={`event-status ${event.status}`}
              >
                {event.status}
              </span>
            </div>

            {/* Event information */}
            <div className="event-card-content">

              <div className="event-card-title">
                <div>
                  <h3>{event.name}</h3>

                  <p className="event-id">
                    {event.id} • {event.category}
                  </p>
                </div>
              </div>

              {/* Date */}
              <div className="event-info-row">
                <CalendarDays size={15} />
                <span>
                  {event.eventDate}
                </span>
              </div>

              {/* Time */}
              <div className="event-info-row">
                <Clock size={15} />
                <span>
                  {event.startTime} - {event.endTime}
                </span>
              </div>

              {/* Venue */}
              <div className="event-info-row">
                <MapPin size={15} />
                <span>
                  {event.venue}
                </span>
              </div>

              {/* Participants */}
              <div className="event-info-row">
                <Users size={15} />
                <span>
                  {event.registeredCount} / {event.participantLimit} registered
                </span>
              </div>

              {/* Registration status */}
              <div className="event-registration">
                <span>Registration</span>

                <span
                  className={`registration-badge ${event.registrationStatus}`}
                >
                  {event.registrationStatus}
                </span>
              </div>

            </div>
          </div>
        ))}
      </section>

    </main>
  );
}

export default Events;