import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import InvoiceTable from '../components/InvoiceTable';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '120px' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <div className="container page" id="dashboard-page">
      {/* Hero Section */}
      <div className="dashboard-hero animate-fade-in">
        <div className="dashboard-hero-content">
          <h1>
            AI Invoice Parser
            <span className="hero-gradient"> Powered by Qwen2.5</span>
          </h1>
          <p>
            Upload invoices and let our fine-tuned Qwen2.5-0.5B-Instruct model extract structured data
            automatically. Built with LoRA fine-tuning for domain-specific accuracy.
          </p>
          <div className="hero-actions">
            <Link to="/upload" className="btn btn-primary" id="hero-upload-btn">
              📤 Upload Invoice
            </Link>
            <Link to="/history" className="btn btn-secondary">
              📋 View History
            </Link>
          </div>
        </div>

        <div className="dashboard-hero-visual">
          <div className="hero-code-block glass">
            <div className="code-header">
              <span className="code-dot" style={{ background: '#ff6b6b' }}></span>
              <span className="code-dot" style={{ background: '#ffb347' }}></span>
              <span className="code-dot" style={{ background: '#00d68f' }}></span>
              <span className="code-title">extracted_data.json</span>
            </div>
            <pre className="code-body">{`{
  "vendor_name": "Acme Corp",
  "invoice_number": "INV-2024",
  "total": 1,250.00,
  "line_items": [...]
}`}</pre>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {error ? (
        <div className="glass" style={{ padding: '24px', textAlign: 'center', color: 'var(--error)' }}>
          <p>Failed to load dashboard: {error}</p>
          <button className="btn btn-secondary btn-sm" onClick={loadStats} style={{ marginTop: '12px' }}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid-stats stagger">
            <StatsCard icon="🧾" label="Total Invoices" value={stats?.total_invoices || 0} color="default" />
            <StatsCard
              icon="💰"
              label="Total Amount"
              value={`$${(stats?.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              color="green"
            />
            <StatsCard
              icon="📊"
              label="Average Invoice"
              value={`$${(stats?.avg_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              color="cyan"
            />
            <StatsCard
              icon="⚠️"
              label="Needs Review"
              value={stats?.needs_review || 0}
              color="orange"
            />
          </div>

          {/* Top Vendors */}
          {stats?.top_vendors?.length > 0 && (
            <div className="glass animate-slide-up" style={{ padding: '24px', marginBottom: '32px' }}>
              <h3 style={{ marginBottom: '16px' }}>Top Vendors</h3>
              <div className="top-vendors">
                {stats.top_vendors.map((v, i) => (
                  <div key={i} className="vendor-item">
                    <span className="vendor-rank">#{i + 1}</span>
                    <span className="vendor-name">{v.vendor_name}</span>
                    <span className="vendor-count">{v.count} invoices</span>
                    <span className="vendor-amount">${(v.total_amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3>Recent Invoices</h3>
              <Link to="/history" className="btn btn-secondary btn-sm">View All →</Link>
            </div>
            <InvoiceTable invoices={stats?.recent_invoices || []} />
          </div>
        </>
      )}

      <style>{`
        .dashboard-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          margin-bottom: 48px;
          padding: 32px 0;
        }

        .hero-gradient {
          display: block;
          background: var(--accent-gradient-cyan);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-hero-content p {
          color: var(--text-secondary);
          margin: 16px 0 24px;
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 520px;
        }

        .hero-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-code-block {
          padding: 0;
          overflow: hidden;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }

        .code-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--glass-border);
        }

        .code-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .code-title {
          margin-left: 8px;
          font-size: 0.75rem;
          color: var(--text-tertiary);
        }

        .code-body {
          padding: 20px;
          font-size: 0.8rem;
          line-height: 1.6;
          color: var(--accent-cyan);
          overflow-x: auto;
          margin: 0;
        }

        .top-vendors {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .vendor-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          transition: background var(--transition-fast);
        }

        .vendor-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }

        .vendor-rank {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--accent-primary);
          min-width: 24px;
        }

        .vendor-name {
          flex: 1;
          font-weight: 500;
          color: var(--text-primary);
        }

        .vendor-count {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .vendor-amount {
          font-weight: 600;
          color: var(--success);
          font-size: 0.9rem;
        }

        @media (max-width: 768px) {
          .dashboard-hero {
            grid-template-columns: 1fr;
            gap: 32px;
          }

          .dashboard-hero-visual {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
}
