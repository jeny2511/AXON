import { Calendar, Clock, MapPin, User, Sparkles } from "lucide-react";
import "./EventCard.css";
import { getAssetUrl } from "../../../utils/urlUtils";

function EventCard({
  title,
  name,
  poster,
  posterUrl,
  date,
  eventDate,
  time,
  startTime,
  endTime,
  venue,
  location,
  description,
  status,
  category,
  speaker,
  speakerName,
  buttonText = "View Details",
  onClick,
  event,
}) {
  const resolvedTitle = title || name || event?.name || event?.title || "Upcoming Event";
  const resolvedPoster = poster || posterUrl || event?.poster || event?.posterUrl || event?.banner || "";
  const posterUrlResolved = resolvedPoster ? getAssetUrl(resolvedPoster) : "";

  const rawDate = date || eventDate || event?.eventDate || (event?.date ? new Date(event.date).toISOString().split("T")[0] : "");
  let formattedDate = rawDate || "Date TBA";
  if (rawDate && !isNaN(new Date(rawDate).getTime())) {
    formattedDate = new Date(rawDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const resolvedTime =
    time ||
    (startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || "") ||
    (event?.startTime && event?.endTime ? `${event.startTime} - ${event.endTime}` : event?.startTime || event?.endTime || event?.time || "Time TBA");

  const resolvedVenue = venue || location || event?.venue || event?.location || "Campus Venue";
  const resolvedDescription = description || event?.description || "Join us for this exciting TCF event.";
  const resolvedStatus = status || event?.status || "Upcoming";
  const resolvedCategory = category || event?.category || "Workshop";
  const resolvedSpeaker = speaker || speakerName || event?.speaker || event?.speakerName || "";

  return (
    <div className="student-event-card">
      <div className="student-event-poster-wrapper">
        {posterUrlResolved ? (
          <img
            src={posterUrlResolved}
            alt={resolvedTitle}
            className="student-event-poster"
            onError={(e) => {
              e.target.style.display = "none";
              const placeholder = e.target.parentElement?.querySelector(".student-event-poster-placeholder");
              if (placeholder) placeholder.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="student-event-poster-placeholder"
          style={{ display: posterUrlResolved ? "none" : "flex" }}
        >
          <Sparkles className="poster-placeholder-icon" size={28} />
          <span className="poster-placeholder-cat">{resolvedCategory}</span>
        </div>

        {resolvedStatus && (
          <span className={`student-event-status-badge ${resolvedStatus.toLowerCase()}`}>
            {resolvedStatus}
          </span>
        )}
      </div>

      <div className="student-event-body">
        <div className="student-event-category">{resolvedCategory}</div>
        <h3 className="student-event-title">{resolvedTitle}</h3>
        <p className="student-event-description">{resolvedDescription}</p>

        <div className="student-event-meta-grid">
          <div className="student-meta-item">
            <Calendar size={14} className="meta-icon" />
            <span className="meta-text"><strong>Date:</strong> {formattedDate}</span>
          </div>
          <div className="student-meta-item">
            <Clock size={14} className="meta-icon" />
            <span className="meta-text"><strong>Time:</strong> {resolvedTime}</span>
          </div>
          <div className="student-meta-item">
            <MapPin size={14} className="meta-icon" />
            <span className="meta-text"><strong>Venue:</strong> {resolvedVenue}</span>
          </div>
          {resolvedSpeaker ? (
            <div className="student-meta-item">
              <User size={14} className="meta-icon" />
              <span className="meta-text"><strong>Speaker:</strong> {resolvedSpeaker}</span>
            </div>
          ) : null}
        </div>

        <button type="button" className="student-event-action-btn" onClick={onClick}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default EventCard;