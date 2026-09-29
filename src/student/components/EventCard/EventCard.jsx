import "./EventCard.css";

function EventCard({
  title,
  poster,
  date,
  time,
  venue,
  description,
  status,
  buttonText = "View More",
  onClick,
}) {
  return (
    <div className="event-card">

      <img src={poster} alt={title} className="event-poster" />

      <div className="event-content">

        <div className="event-header">
          <h3>{title}</h3>

          {status && (
            <span className={`event-status ${status.toLowerCase()}`}>
              {status}
            </span>
          )}
        </div>

        <p className="event-description">{description}</p>

        <div className="event-details">
  <p>{date}</p>
  <p>{time}</p>
  <p>{venue}</p>
</div>

        <button className="event-button" onClick={onClick}>
          {buttonText}
        </button>
        

      </div>

    </div>
  );
}

export default EventCard;