import { useState } from "react";
import StudentLayout from "../layouts/StudentLayout";
import "./EventDetails.css";

function EventDetails() {
  const [registered, setRegistered] = useState(false);

  const event = {
    id: "EV001",
    name: "Capture The Flag 2027",
    description:
      "A cybersecurity challenge covering web security, cryptography, networking and digital forensics.",
    venue: "VGEC Campus",
    eventDate: "2027-09-30",
    startTime: "10:00 AM",
    endTime: "01:00 PM",
    poster: "/assets/images/events/ctf2027.jpg",
    rulebook: "/assets/rulebooks/ctf2027.pdf",
  };

  const handleRegister = () => {
    setRegistered(true);
    alert("Event registered successfully!");
  };

  return (
    <StudentLayout>
      <div className="student-page">
        <div className="event-details-page">
          <div className="event-details-card">

            <img
              src={event.poster}
              alt={event.name}
              className="event-details-poster"
            />

            <div className="event-details-content">
              <h1>{event.name}</h1>

              <p className="event-details-description">
                {event.description}
              </p>

              <div className="event-info">
                <p>
                  <strong>Date:</strong> {event.eventDate}
                </p>

                <p>
                  <strong>Time:</strong> {event.startTime} -{" "}
                  {event.endTime}
                </p>

                <p>
                  <strong>Venue:</strong> {event.venue}
                </p>
              </div>

              <div className="event-details-actions">
                <a
                  href={event.rulebook}
                  target="_blank"
                  rel="noreferrer"
                  className="rulebook-button"
                >
                  View Rulebook
                </a>

                <button
                  type="button"
                  className="register-button"
                  onClick={handleRegister}
                  disabled={registered}
                >
                  {registered ? "Registered ✓" : "Register"}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default EventDetails;