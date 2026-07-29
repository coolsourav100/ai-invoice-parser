export default function ProcessingStatus({ stage, uploadProgress = 0 }) {
  const stages = [
    { key: 'uploading', label: 'Uploading', icon: '📤' },
    { key: 'ocr', label: 'OCR Scan', icon: '🔍' },
    { key: 'model', label: 'AI Extraction', icon: '🧠' },
    { key: 'done', label: 'Complete', icon: '✅' },
  ];

  const currentIndex = stages.findIndex((s) => s.key === stage);
  const isError = stage === 'error';

  return (
    <div className="processing-status animate-fade-in" id="processing-status">
      <div className="processing-stages">
        {stages.map((s, i) => (
          <div
            key={s.key}
            className={`processing-stage ${
              i < currentIndex ? 'completed' :
              i === currentIndex ? (isError ? 'error' : 'active') :
              'pending'
            }`}
          >
            <div className="processing-dot">
              {i < currentIndex ? '✓' : s.icon}
            </div>
            <span className="processing-label">{s.label}</span>
            {i < stages.length - 1 && (
              <div className={`processing-line ${i < currentIndex ? 'filled' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {stage === 'uploading' && (
        <div className="processing-progress">
          <div className="processing-bar">
            <div className="processing-fill" style={{ width: `${uploadProgress}%` }} />
          </div>
          <span className="processing-pct">{uploadProgress}%</span>
        </div>
      )}

      {stage === 'ocr' && (
        <p className="processing-message">Extracting text from your invoice with Tesseract OCR...</p>
      )}

      {stage === 'model' && (
        <p className="processing-message">Running fine-tuned Qwen2.5-0.5B-Instruct for structured extraction...</p>
      )}

      {isError && (
        <p className="processing-error">Processing failed. Please try again.</p>
      )}

      <style>{`
        .processing-status {
          padding: 32px;
        }

        .processing-stages {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          margin-bottom: 24px;
        }

        .processing-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          flex: 1;
        }

        .processing-dot {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 1.2rem;
          border: 2px solid var(--glass-border);
          background: var(--glass-bg);
          transition: all var(--transition-base);
          position: relative;
          z-index: 2;
        }

        .processing-stage.completed .processing-dot {
          border-color: var(--success);
          background: var(--success-bg);
          color: var(--success);
          font-size: 0.9rem;
          font-weight: 700;
        }

        .processing-stage.active .processing-dot {
          border-color: var(--accent-primary);
          background: rgba(102, 126, 234, 0.15);
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
          animation: pulse 1.5s ease-in-out infinite;
        }

        .processing-stage.error .processing-dot {
          border-color: var(--error);
          background: var(--error-bg);
        }

        .processing-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .processing-stage.completed .processing-label,
        .processing-stage.active .processing-label {
          color: var(--text-secondary);
        }

        .processing-line {
          position: absolute;
          top: 22px;
          left: calc(50% + 26px);
          width: calc(100% - 52px);
          height: 2px;
          background: var(--glass-border);
          z-index: 1;
          transition: background var(--transition-base);
        }

        .processing-line.filled {
          background: var(--success);
        }

        .processing-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .processing-bar {
          flex: 1;
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 3px;
          overflow: hidden;
        }

        .processing-fill {
          height: 100%;
          background: var(--accent-gradient);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .processing-pct {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--accent-primary);
          min-width: 36px;
        }

        .processing-message {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .processing-error {
          text-align: center;
          font-size: 0.85rem;
          color: var(--error);
        }

        @media (max-width: 480px) {
          .processing-label {
            font-size: 0.65rem;
          }
          .processing-dot {
            width: 36px;
            height: 36px;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
