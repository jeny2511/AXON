function StatCard({ title, value, subtitle, icon: Icon, className = "" }) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-top">
        <div>
          <p>{title}</p>
          <h2>{value}</h2>
        </div>

        <div className="stat-icon">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>

      <span className="stat-subtitle">{subtitle}</span>
    </div>
  );
}

export default StatCard;