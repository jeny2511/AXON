import "./CertificateCard.css";
function CertificateCard({
  title,
  eventName,
  issueDate,
  verificationCode,
  certificateUrl,
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
        <strong>Issue Date:</strong> {issueDate}
      </p>

      <p>
        <strong>Verification Code:</strong> {verificationCode}
      </p>

      <div className="certificate-actions">
        {certificateUrl && (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noreferrer"
          >
            View Certificate
          </a>
        )}

        {onView && (
          <button type="button" onClick={onView}>
            View Details
          </button>
        )}
      </div>
    </div>
  );
}

export default CertificateCard;