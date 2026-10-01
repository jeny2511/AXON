import "./StatsCard.css";

function StatsCard({ title, value }) {
  return (
    <div className="stats-card">
      <div className="stats-info">
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default StatsCard;