import { useNavigate } from 'react-router-dom';

export default function InvoiceTable({ invoices = [], onSort, sortBy, sortOrder }) {
  const navigate = useNavigate();

  const columns = [
    { key: 'vendor_name', label: 'Vendor' },
    { key: 'invoice_number', label: 'Invoice #' },
    { key: 'invoice_date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Uploaded' },
  ];

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const map = {
      processed: { class: 'badge-success', label: 'Processed' },
      needs_review: { class: 'badge-warning', label: 'Needs Review' },
      reviewed: { class: 'badge-info', label: 'Reviewed' },
      error: { class: 'badge-error', label: 'Error' },
    };
    const s = map[status] || map.processed;
    return <span className={`badge ${s.class}`}>{s.label}</span>;
  };

  const handleSort = (key) => {
    onSort?.(key, sortBy === key && sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const getSortIndicator = (key) => {
    if (sortBy !== key) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  if (invoices.length === 0) {
    return (
      <div className="empty-state glass">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3>No invoices yet</h3>
        <p>Upload your first invoice to get started</p>
      </div>
    );
  }

  return (
    <div className="glass table-wrapper" id="invoice-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} onClick={() => handleSort(col.key)}>
                {col.label}{getSortIndicator(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr
              key={inv.id}
              className="clickable"
              onClick={() => navigate(`/invoice/${inv.id}`)}
            >
              <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {inv.vendor_name || 'Unknown Vendor'}
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {inv.invoice_number || '—'}
              </td>
              <td>{formatDate(inv.invoice_date)}</td>
              <td style={{ fontWeight: 600, color: 'var(--success)' }}>
                {formatCurrency(inv.total, inv.currency)}
              </td>
              <td>{getStatusBadge(inv.status)}</td>
              <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
                {formatDate(inv.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
