import { useState, useEffect } from 'react';
import InvoiceTable from '../components/InvoiceTable';
import { api } from '../services/api';

export default function History() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, [pagination.page, sortBy, sortOrder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((p) => ({ ...p, page: 1 }));
      loadInvoices();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices({
        page: pagination.page,
        limit: pagination.limit,
        search,
        sortBy,
        sortOrder,
      });
      setInvoices(data.invoices);
      setPagination((p) => ({ ...p, ...data.pagination }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handlePageChange = (newPage) => {
    setPagination((p) => ({ ...p, page: newPage }));
  };

  return (
    <div className="container page" id="history-page">
      <div className="page-header animate-fade-in">
        <h1>📋 Invoice History</h1>
        <p>Browse, search, and manage all parsed invoices.</p>
      </div>

      {/* Search Bar */}
      <div className="history-toolbar glass animate-fade-in">
        <div className="search-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="input search-input"
            type="text"
            placeholder="Search by vendor, invoice number, or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="invoice-search"
          />
        </div>
        <span className="history-count">
          {pagination.total} invoice{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--error-bg)', borderRadius: 'var(--radius-md)', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {loading && invoices.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner spinner-lg"></div>
        </div>
      ) : (
        <>
          <div className="animate-slide-up">
            <InvoiceTable
              invoices={invoices}
              onSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 7) {
                  pageNum = i + 1;
                } else if (pagination.page <= 4) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 3) {
                  pageNum = pagination.totalPages - 6 + i;
                } else {
                  pageNum = pagination.page - 3 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={pageNum === pagination.page ? 'active' : ''}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        .history-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 16px;
          margin-bottom: 24px;
        }

        .search-wrapper {
          position: relative;
          flex: 1;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
        }

        .search-input {
          padding-left: 40px;
          background: transparent;
          border: none;
        }

        .search-input:focus {
          box-shadow: none;
        }

        .history-count {
          font-size: 0.8rem;
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .history-toolbar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-wrapper {
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}
