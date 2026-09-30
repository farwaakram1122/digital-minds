export default function StatCard({
  label,
  value,
  meta,
  icon: Icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {Icon && <Icon size={19} />}
      </div>

      <div>
        <div className="muted small">
          {label}
        </div>
        <strong>{value}</strong>
        {meta && (
          <div className="small positive">
            {meta}
          </div>
        )}
      </div>
    </div>
  );
}
