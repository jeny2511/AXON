import "./ProgressBar.css";
function ProgressBar({ current, total, label = "Progress" }) {
  const safeTotal = total > 0 ? total : 1;

  const percentage = Math.min(
    Math.round((current / safeTotal) * 100),
    100
  );

  return (
    <div className="progress-container">
      <div className="progress-header">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <small>{percentage}% completed</small>
    </div>
  );
}

export default ProgressBar;