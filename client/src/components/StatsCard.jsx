export default function StatsCard({ icon, label, value, subtitle, trend, color = 'default' }) {
  const colorMap = {
    default: 'var(--accent-primary)',
    cyan: 'var(--accent-cyan)',
    green: 'var(--success)',
    orange: 'var(--warning)',
    red: 'var(--error)',
  };

  const accentColor = colorMap[color] || colorMap.default;

  return (
    <div className="stats-card glass animate-fade-in" id={`stat-${label?.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="stats-card-header">
        <span className="stats-card-icon" style={{ background: `${accentColor}20`, color: accentColor }}>
          {icon}
        </span>
        {trend !== undefined && (
          <span className={`stats-card-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="stats-card-value" style={{ color: accentColor }}>{value}</div>
      <div className="stats-card-label">{label}</div>
      {subtitle && <div className="stats-card-subtitle">{subtitle}</div>}

      <style>{`
        .stats-card {
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .stats-card::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, ${accentColor}08 0%, transparent 70%);
          border-radius: 50%;
          transform: translate(30%, -30%);
        }

        .stats-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .stats-card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          font-size: 1.2rem;
        }

        .stats-card-trend {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 20px;
        }

        .stats-card-trend.positive {
          background: var(--success-bg);
          color: var(--success);
        }

        .stats-card-trend.negative {
          background: var(--error-bg);
          color: var(--error);
        }

        .stats-card-value {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 4px;
        }

        .stats-card-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stats-card-subtitle {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
