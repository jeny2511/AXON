import "./CertificateCard.css";

function CertificateCard({
  title,
  eventName,
  issueDate,
  status,
  onView,
}) {
  return (
    <div className="certificate-card">
      <div className="certificate-card-header">
        <h3>{title}</h3>

        {status && (
          <span className={`certificate-status ${status.toLowerCase()}`}>
            {status}
          </span>
        )}
      </div>

      <p className="certificate-event">{eventName}</p>

      <p>
        <strong>Issue Date:</strong> {issueDate || "Not issued yet"}
      </p>

      <div className="certificate-actions">
        {onView && (
          <button type="button" onClick={onView}>
            View Certificate
          </button>
        )}
      </div>
    </div>
  );
}

export default CertificateCard;