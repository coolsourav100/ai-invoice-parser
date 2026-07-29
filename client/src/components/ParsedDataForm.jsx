export default function ParsedDataForm({ data, onChange, readOnly = false }) {
  const handleFieldChange = (field, value) => {
    onChange?.({ ...data, [field]: value });
  };

  const handleLineItemChange = (index, field, value) => {
    const items = [...(data.line_items || [])];
    items[index] = { ...items[index], [field]: value };
    onChange?.({ ...data, line_items: items });
  };

  const addLineItem = () => {
    const items = [...(data.line_items || []), { description: '', quantity: 0, unit_price: 0, amount: 0 }];
    onChange?.({ ...data, line_items: items });
  };

  const removeLineItem = (index) => {
    const items = (data.line_items || []).filter((_, i) => i !== index);
    onChange?.({ ...data, line_items: items });
  };

  return (
    <div className="parsed-form" id="parsed-data-form">
      <div className="parsed-form-grid">
        <div className="form-group">
          <label>Vendor Name</label>
          <input className="input" value={data?.vendor_name || ''} readOnly={readOnly}
            onChange={(e) => handleFieldChange('vendor_name', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Invoice Number</label>
          <input className="input" value={data?.invoice_number || ''} readOnly={readOnly}
            onChange={(e) => handleFieldChange('invoice_number', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Invoice Date</label>
          <input className="input" type="date" value={data?.invoice_date || ''} readOnly={readOnly}
            onChange={(e) => handleFieldChange('invoice_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input className="input" type="date" value={data?.due_date || ''} readOnly={readOnly}
            onChange={(e) => handleFieldChange('due_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Currency</label>
          <select className="input" value={data?.currency || 'USD'} disabled={readOnly}
            onChange={(e) => handleFieldChange('currency', e.target.value)}>
            {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <h3 style={{ margin: '24px 0 12px', fontSize: '0.9rem' }}>Line Items</h3>

      {(data?.line_items || []).length > 0 ? (
        <div className="line-items-table">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
                {!readOnly && <th></th>}
              </tr>
            </thead>
            <tbody>
              {(data.line_items || []).map((item, i) => (
                <tr key={i}>
                  <td>
                    <input className="input" value={item.description || ''} readOnly={readOnly}
                      onChange={(e) => handleLineItemChange(i, 'description', e.target.value)}
                      style={{ minWidth: '200px' }} />
                  </td>
                  <td>
                    <input className="input" type="number" step="any" value={item.quantity || 0} readOnly={readOnly}
                      onChange={(e) => handleLineItemChange(i, 'quantity', parseFloat(e.target.value) || 0)}
                      style={{ width: '80px' }} />
                  </td>
                  <td>
                    <input className="input" type="number" step="0.01" value={item.unit_price || 0} readOnly={readOnly}
                      onChange={(e) => handleLineItemChange(i, 'unit_price', parseFloat(e.target.value) || 0)}
                      style={{ width: '110px' }} />
                  </td>
                  <td>
                    <input className="input" type="number" step="0.01" value={item.amount || 0} readOnly={readOnly}
                      onChange={(e) => handleLineItemChange(i, 'amount', parseFloat(e.target.value) || 0)}
                      style={{ width: '110px' }} />
                  </td>
                  {!readOnly && (
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => removeLineItem(i)}>✕</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No line items extracted</p>
      )}

      {!readOnly && (
        <button className="btn btn-secondary btn-sm" onClick={addLineItem} style={{ marginTop: '12px' }}>
          + Add Line Item
        </button>
      )}

      <div className="parsed-form-totals">
        <div className="form-group">
          <label>Subtotal</label>
          <input className="input" type="number" step="0.01" value={data?.subtotal || 0} readOnly={readOnly}
            onChange={(e) => handleFieldChange('subtotal', parseFloat(e.target.value) || 0)} />
        </div>
        <div className="form-group">
          <label>Tax</label>
          <input className="input" type="number" step="0.01" value={data?.tax || 0} readOnly={readOnly}
            onChange={(e) => handleFieldChange('tax', parseFloat(e.target.value) || 0)} />
        </div>
        <div className="form-group">
          <label>Total</label>
          <input className="input total-input" type="number" step="0.01" value={data?.total || 0} readOnly={readOnly}
            onChange={(e) => handleFieldChange('total', parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      <style>{`
        .parsed-form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .line-items-table {
          overflow-x: auto;
          margin-top: 8px;
        }

        .line-items-table table {
          min-width: 600px;
        }

        .line-items-table td {
          padding: 6px 8px;
        }

        .line-items-table th {
          padding: 8px;
        }

        .line-items-table .input {
          padding: 6px 10px;
          font-size: 0.8rem;
        }

        .parsed-form-totals {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--glass-border);
        }

        .total-input {
          font-weight: 700;
          color: var(--success) !important;
          font-size: 1rem !important;
        }
      `}</style>
    </div>
  );
}
