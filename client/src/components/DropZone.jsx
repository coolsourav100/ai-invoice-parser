import { useState, useRef, useCallback } from 'react';

export default function DropZone({ onFileSelect, disabled = false, accept = '.jpg,.jpeg,.png,.pdf,.tiff,.bmp' }) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file) return;

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview({ type: 'image', url: e.target.result, name: file.name, size: file.size });
      reader.readAsDataURL(file);
    } else {
      setPreview({ type: 'pdf', name: file.name, size: file.size });
    }

    onFileSelect?.(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFile(file);
  }, [handleFile]);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const clearPreview = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''} ${disabled ? 'disabled' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      id="invoice-dropzone"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        hidden
      />

      {preview ? (
        <div className="dropzone-preview">
          {preview.type === 'image' ? (
            <img src={preview.url} alt="Invoice preview" className="dropzone-thumbnail" />
          ) : (
            <div className="dropzone-pdf-icon">📄</div>
          )}
          <div className="dropzone-file-info">
            <span className="dropzone-file-name">{preview.name}</span>
            <span className="dropzone-file-size">{formatSize(preview.size)}</span>
          </div>
          <button className="dropzone-clear" onClick={clearPreview}>✕</button>
        </div>
      ) : (
        <div className="dropzone-placeholder">
          <div className="dropzone-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className="dropzone-text">
            <strong>Drop your invoice here</strong> or click to browse
          </p>
          <p className="dropzone-hint">Supports JPG, PNG, PDF, TIFF • Max 10MB</p>
        </div>
      )}

      <style>{`
        .dropzone {
          position: relative;
          padding: 48px 24px;
          border: 2px dashed var(--glass-border);
          border-radius: var(--radius-xl);
          background: var(--glass-bg);
          cursor: pointer;
          transition: all var(--transition-base);
          text-align: center;
        }

        .dropzone:hover:not(.disabled) {
          border-color: var(--accent-primary);
          background: rgba(102, 126, 234, 0.05);
        }

        .dropzone.dragging {
          border-color: var(--accent-cyan);
          background: rgba(0, 210, 255, 0.08);
          transform: scale(1.01);
          box-shadow: 0 0 40px rgba(0, 210, 255, 0.1);
        }

        .dropzone.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dropzone.has-preview {
          padding: 24px;
        }

        .dropzone-icon {
          color: var(--text-tertiary);
          margin-bottom: 16px;
          transition: all var(--transition-base);
        }

        .dropzone:hover .dropzone-icon {
          color: var(--accent-primary);
          transform: translateY(-4px);
        }

        .dropzone.dragging .dropzone-icon {
          color: var(--accent-cyan);
          transform: translateY(-8px) scale(1.1);
        }

        .dropzone-text {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .dropzone-text strong {
          color: var(--text-primary);
        }

        .dropzone-hint {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .dropzone-preview {
          display: flex;
          align-items: center;
          gap: 16px;
          text-align: left;
        }

        .dropzone-thumbnail {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
        }

        .dropzone-pdf-icon {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
        }

        .dropzone-file-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dropzone-file-name {
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
          word-break: break-all;
        }

        .dropzone-file-size {
          font-size: 0.8rem;
          color: var(--text-tertiary);
        }

        .dropzone-clear {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 107, 107, 0.15);
          color: var(--error);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all var(--transition-fast);
        }

        .dropzone-clear:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
