// Navigation bar component
import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const NAV_LINKS = [
  { key: 'home', label: 'Home' },
  { key: 'submit', label: 'Submit' },
  { key: 'request', label: 'Request' },
  { key: 'announcements', label: 'Announcements' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'admin', label: 'Admin' },
];

function Navbar({ page, navigate, adminUser }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNav = (key) => {
    navigate(key);
    setMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('home');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Brand */}
        <button className="nav-brand" onClick={() => handleNav('home')}>
          Digital Trashcan
        </button>

        {/* Desktop links */}
        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.key}>
              <button
                className={`nav-link${page === link.key ? ' active' : ''}`}
                onClick={() => handleNav(link.key)}
              >
                {link.label}
              </button>
            </li>
          ))}
          {adminUser && (
            <li>
              <button className="nav-link btn-signout" onClick={handleSignOut}>
                Sign Out
              </button>
            </li>
          )}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
          <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
          <span className={`ham-line${menuOpen ? ' open' : ''}`}></span>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="nav-mobile">
          {NAV_LINKS.map((link) => (
            <button
              key={link.key}
              className={`nav-mobile-link${page === link.key ? ' active' : ''}`}
              onClick={() => handleNav(link.key)}
            >
              {link.label}
            </button>
          ))}
          {adminUser && (
            <button className="nav-mobile-link signout" onClick={handleSignOut}>
              Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--green-dark);
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.25rem;
          height: 60px;
        }
        .nav-brand {
          background: none;
          border: none;
          color: var(--white);
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.02em;
          padding: 0;
          flex-shrink: 0;
        }
        .nav-links {
          display: flex;
          list-style: none;
          gap: 0.25rem;
          align-items: center;
        }
        .nav-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.82);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.375rem 0.75rem;
          border-radius: var(--radius);
          transition: background 0.15s, color 0.15s;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.12);
          color: var(--white);
        }
        .nav-link.active {
          background: rgba(255,255,255,0.18);
          color: var(--white);
          font-weight: 600;
        }
        .btn-signout {
          color: var(--green-light);
        }
        .nav-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.375rem;
        }
        .ham-line {
          display: block;
          width: 22px;
          height: 2px;
          background: var(--white);
          border-radius: 2px;
          transition: transform 0.2s;
        }
        .nav-mobile {
          display: flex;
          flex-direction: column;
          background: var(--green-dark);
          padding: 0.5rem 1rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .nav-mobile-link {
          background: none;
          border: none;
          color: rgba(255,255,255,0.85);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.65rem 0.5rem;
          text-align: left;
          border-radius: var(--radius);
          transition: background 0.15s;
        }
        .nav-mobile-link:hover, .nav-mobile-link.active {
          background: rgba(255,255,255,0.12);
          color: var(--white);
        }
        .nav-mobile-link.signout {
          color: var(--green-light);
        }
        @media (max-width: 720px) {
          .nav-links { display: none; }
          .nav-hamburger { display: flex; }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
