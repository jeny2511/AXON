import "./NotificationCard.css";

function NotificationCard({
  title,
  message,
  type,
  isRead,
  onClick,
}) {
  return (
    <div
  className={`notification-card ${isRead ? "read" : "unread"}`}
  onClick={onClick}
>

      <div className="notification-content">

        <div className="notification-header">
          <h3>{title}</h3>
          <span className="notification-type">{type}</span>
        </div>

        <p>{message}</p>

      </div>

    </div>
  );
}

export default NotificationCard;