import "./StatsCard.css";

function StatsCard({ title, value, icon: Icon, subtitle }) {
  return (
    <div className="stats-card">
      <div className="stats-info">
        <p className="stats-title">{title}</p>
        <h2 className="stats-value">{value}</h2>
        {subtitle && <span className="stats-subtitle">{subtitle}</span>}
      </div>
      {Icon && (
        <div className="stats-icon-wrapper">
          <Icon size={22} className="stats-icon" />
        </div>
      )}
    </div>
  );
}

export default StatsCard;