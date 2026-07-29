import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ParsedDataForm from '../components/ParsedDataForm';
import { api } from '../services/api';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoice(id);
      setInvoice(data);
      setEditedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await api.updateInvoice(id, editedData);
      setInvoice(updated);
      setEditedData(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      await api.deleteInvoice(id);
      navigate('/history');
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '120px' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="container page">
        <div className="glass" style={{ padding: '48px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--error)', marginBottom: '12px' }}>Invoice Not Found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{error}</p>
          <Link to="/history" className="btn btn-secondary">← Back to History</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page" id="invoice-detail-page">
      {/* Breadcrumb */}
      <div className="detail-breadcrumb animate-fade-in">
        <Link to="/history">← History</Link>
        <span>/</span>
        <span>{invoice?.invoice_number || 'Invoice'}</span>
      </div>

      {/* Header */}
      <div className="detail-header glass animate-fade-in">
        <div className="detail-header-left">
          <h2>{invoice?.vendor_name || 'Unknown Vendor'}</h2>
          <div className="detail-meta">
            <span>Invoice #{invoice?.invoice_number || '—'}</span>
            <span>•</span>
            <span>{formatDate(invoice?.invoice_date)}</span>
            <span>•</span>
            <span className={`badge ${
              invoice?.status === 'processed' ? 'badge-success' :
              invoice?.status === 'needs_review' ? 'badge-warning' :
              invoice?.status === 'reviewed' ? 'badge-info' : 'badge-error'
            }`}>
              {invoice?.status}
            </span>
          </div>
        </div>
        <div className="detail-header-right">
          <span className="detail-total">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoice?.currency || 'USD' }).format(invoice?.total || 0)}
          </span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="detail-grid">
        {/* Left: Extracted Data */}
        <div className="detail-data glass animate-slide-up">
          <div className="detail-section-header">
            <h3>📋 Extracted Data</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {editing ? (
                <>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(false); setEditedData(invoice); }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                  ✏️ Edit
                </button>
              )}
            </div>
          </div>
          <ParsedDataForm data={editedData} onChange={setEditedData} readOnly={!editing} />
        </div>

        {/* Right: Raw Text & Metadata */}
        <div className="detail-sidebar">
          {/* Processing Info */}
          <div className="glass animate-slide-up" style={{ padding: '20px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>⚡ Processing Info</h3>
            <div className="detail-info-grid">
              <div className="info-item">
                <span className="info-label">File</span>
                <span className="info-value">{invoice?.file_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">OCR Time</span>
                <span className="info-value">{invoice?.ocr_time_ms || 0}ms</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model Time</span>
                <span className="info-value">{invoice?.model_time_ms || 0}ms</span>
              </div>
              <div className="info-item">
                <span className="info-label">Uploaded</span>
                <span className="info-value">{formatDate(invoice?.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Raw OCR Text */}
          <div className="glass animate-slide-up" style={{ padding: '20px', animationDelay: '100ms' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>📝 Raw OCR Text</h3>
            <pre className="raw-text-block">{invoice?.raw_text || 'No OCR text available'}</pre>
          </div>

          {/* Actions */}
          <div className="glass animate-slide-up" style={{ padding: '20px', marginTop: '16px', animationDelay: '200ms' }}>
            <h3 style={{ fontSize: '0.85rem', marginBottom: '12px' }}>🔧 Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/upload" className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                📤 Upload New Invoice
              </Link>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ justifyContent: 'flex-start' }}>
                🗑️ Delete Invoice
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--error-bg)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <style>{`
        .detail-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
          font-size: 0.85rem;
          color: var(--text-tertiary);
        }

        .detail-breadcrumb a {
          color: var(--text-accent);
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 28px;
          margin-bottom: 24px;
        }

        .detail-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .detail-total {
          font-size: 2rem;
          font-weight: 800;
          color: var(--success);
          letter-spacing: -0.02em;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
        }

        .detail-data {
          padding: 24px;
        }

        .detail-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .detail-info-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .info-value {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--text-secondary);
          font-family: 'SF Mono', monospace;
          text-align: right;
          word-break: break-all;
          max-width: 60%;
        }

        .raw-text-block {
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: var(--radius-md);
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.7rem;
          line-height: 1.6;
          color: var(--text-secondary);
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 300px;
          overflow-y: auto;
          margin: 0;
        }

        @media (max-width: 768px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }

          .detail-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}
