import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import InvoiceDetail from './pages/InvoiceDetail';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/invoice/:id" element={<InvoiceDetail />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <div className="container">
          <p>
            Built with <span style={{ color: 'var(--error)' }}>♥</span> using{' '}
            <a href="https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct" target="_blank" rel="noopener noreferrer">
              Qwen2.5-0.5B-Instruct
            </a>{' '}
            + LoRA fine-tuning • React • Node.js • PostgreSQL
          </p>
        </div>
        <style>{`
          .app-footer {
            padding: 24px 0;
            border-top: 1px solid var(--glass-border);
            text-align: center;
          }

          .app-footer p {
            font-size: 0.8rem;
            color: var(--text-tertiary);
          }
        `}</style>
      </footer>
    </BrowserRouter>
  );
}
