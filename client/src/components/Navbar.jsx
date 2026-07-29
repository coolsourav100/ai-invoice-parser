import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/upload', label: 'Upload', icon: '📤' },
  { path: '/history', label: 'History', icon: '📋' },
];

export default function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar" id="main-navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">🧾</span>
          <span className="navbar-title">AI Invoice Parser</span>
          <span className="navbar-badge">Qwen2.5</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {NAV_ITEMS.map(({ path, label, icon }) => (
            <li key={path}>
              <Link
                to={path}
                className={`navbar-link ${location.pathname === path ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="navbar-link-icon">{icon}</span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10, 14, 26, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--glass-border);
        }

        .navbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-primary);
          font-weight: 700;
          font-size: 1.1rem;
          text-decoration: none;
        }

        .navbar-logo {
          font-size: 1.5rem;
        }

        .navbar-title {
          background: var(--accent-gradient-cyan);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-badge {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 2px 8px;
          background: var(--accent-gradient);
          color: white;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .navbar-links {
          display: flex;
          list-style: none;
          gap: 4px;
        }

        .navbar-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }

        .navbar-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .navbar-link.active {
          color: white;
          background: var(--accent-gradient);
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
        }

        .navbar-link-icon {
          font-size: 1rem;
        }

        .navbar-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .navbar-toggle span {
          display: block;
          width: 20px;
          height: 2px;
          background: var(--text-secondary);
          border-radius: 1px;
          transition: all var(--transition-fast);
        }

        @media (max-width: 768px) {
          .navbar-toggle {
            display: flex;
          }

          .navbar-links {
            position: absolute;
            top: 64px;
            left: 0;
            right: 0;
            flex-direction: column;
            padding: 12px;
            background: rgba(10, 14, 26, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--glass-border);
            transform: translateY(-100%);
            opacity: 0;
            pointer-events: none;
            transition: all var(--transition-base);
          }

          .navbar-links.open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
          }
        }
      `}</style>
    </nav>
  );
}
