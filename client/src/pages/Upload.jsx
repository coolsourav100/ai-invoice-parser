import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DropZone from '../components/DropZone';
import ProcessingStatus from '../components/ProcessingStatus';
import ParsedDataForm from '../components/ParsedDataForm';
import { api } from '../services/api';

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState(null); // null | uploading | ocr | model | done | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [editedData, setEditedData] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback((selectedFile) => {
    setFile(selectedFile);
    setStage(null);
    setResult(null);
    setEditedData(null);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    try {
      setError(null);
      setStage('uploading');
      setUploadProgress(0);

      const response = await api.uploadInvoice(file, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) {
          // File uploaded, now server is processing (OCR + model)
          setStage('ocr');
          setTimeout(() => setStage('model'), 1500); // Simulated stage transition
        }
      });

      setStage('done');
      setResult(response);
      setEditedData(response.invoice);
    } catch (err) {
      setStage('error');
      setError(err.message);
    }
  };

  const handleSaveEdits = async () => {
    if (!editedData?.id) return;
    try {
      await api.updateInvoice(editedData.id, editedData);
      navigate(`/invoice/${editedData.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStage(null);
    setResult(null);
    setEditedData(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <div className="container page" id="upload-page">
      <div className="page-header animate-fade-in">
        <h1>📤 Upload Invoice</h1>
        <p>Upload an invoice image or PDF to extract structured data using our fine-tuned AI model.</p>
      </div>

      {/* Drop Zone */}
      <div className="animate-slide-up">
        <DropZone
          onFileSelect={handleFileSelect}
          disabled={stage === 'uploading' || stage === 'ocr' || stage === 'model'}
        />
      </div>

      {/* Action Button */}
      {file && !stage && (
        <div className="upload-actions animate-fade-in" style={{ marginTop: '24px', textAlign: 'center' }}>
          <button className="btn btn-primary" onClick={handleUpload} id="parse-invoice-btn">
            🧠 Parse Invoice with AI
          </button>
        </div>
      )}

      {/* Processing Status */}
      {stage && stage !== 'done' && (
        <div className="glass" style={{ marginTop: '24px' }}>
          <ProcessingStatus stage={stage} uploadProgress={uploadProgress} />
          {error && (
            <div style={{ padding: '0 32px 24px', textAlign: 'center' }}>
              <p style={{ color: 'var(--error)', marginBottom: '12px' }}>{error}</p>
              <button className="btn btn-secondary btn-sm" onClick={handleReset}>Try Again</button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {stage === 'done' && result && (
        <div className="upload-results animate-slide-up" style={{ marginTop: '32px' }}>
          {/* Timings */}
          <div className="glass" style={{ padding: '20px 24px', marginBottom: '24px' }}>
            <div className="timing-row">
              <span className="timing-label">✅ Extraction Complete</span>
              <div className="timing-values">
                {result.timings?.ocr_ms && (
                  <span className="timing-chip">OCR: {result.timings.ocr_ms}ms</span>
                )}
                {result.timings?.model_ms && (
                  <span className="timing-chip">Model: {result.timings.model_ms}ms</span>
                )}
                {result.timings?.total_ms && (
                  <span className="timing-chip accent">Total: {result.timings.total_ms}ms</span>
                )}
              </div>
            </div>
          </div>

          {/* Extracted Data Form */}
          <div className="glass" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Extracted Data</h3>
              <span className="badge badge-info">Editable — correct any errors</span>
            </div>
            <ParsedDataForm data={editedData} onChange={setEditedData} />
          </div>

          {/* Action Buttons */}
          <div className="upload-result-actions" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleSaveEdits} id="save-invoice-btn">
              💾 Save & View Invoice
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/invoice/${editedData?.id}`)}>
              👁️ View Detail
            </button>
            <button className="btn btn-secondary" onClick={handleReset}>
              📤 Upload Another
            </button>
          </div>
        </div>
      )}

      <style>{`
        .timing-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }

        .timing-label {
          font-weight: 600;
          color: var(--success);
        }

        .timing-values {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .timing-chip {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-family: 'SF Mono', monospace;
        }

        .timing-chip.accent {
          background: rgba(102, 126, 234, 0.15);
          color: var(--accent-primary);
        }
      `}</style>
    </div>
  );
}
