// Improvement #5: Document title per page
// Improvement #8: Scroll to top on navigation
// Improvement #4: Professional footer
// Improvement #9: Live pending count for navbar badge
// Improvement #16: Back-to-top button
import { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import Navbar from './components/Navbar';
import SubmitRecyclables from './components/SubmitRecyclables';
import RequestMaterials from './components/RequestMaterials';
import Announcements from './components/Announcements';
import Feedback from './components/Feedback';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';

const PAGE_TITLES = {
  home: 'Digital Trash Can',
  submit: 'Submit Recyclables | Digital Trash Can',
  request: 'Request Materials | Digital Trash Can',
  announcements: 'Announcements | Digital Trash Can',
  feedback: 'Feedback | Digital Trash Can',
  admin: 'Admin Dashboard | Digital Trash Can',
};

function getPageFromHash() {
  return window.location.hash.replace('#', '') || 'home';
}

// Improvement #9: live pending count for navbar badge
function usePendingCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'requests'), (snap) => {
      setCount(snap.docs.filter((d) => d.data().status === 'Pending').length);
    });
    return unsub;
  }, []);
  return count;
}

// Improvement #16: back-to-top button
function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);
  if (!visible) return null;
  return (
    <button
      className="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
    >
      Back to top
    </button>
  );
}

function App() {
  const [page, setPage] = useState(getPageFromHash());
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pendingCount = usePendingCount();

  useEffect(() => {
    const handler = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Improvement #5: update document title per page
  useEffect(() => {
    document.title = PAGE_TITLES[page] || 'Digital Trash Can';
  }, [page]);

  const navigate = (p) => {
    window.location.hash = p;
    setPage(p);
    // Improvement #8: scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (page) {
      case 'submit':       return <SubmitRecyclables />;
      case 'request':      return <RequestMaterials />;
      case 'announcements':return <Announcements />;
      case 'feedback':     return <Feedback />;
      case 'admin':
        if (authLoading) return <div className="loading"><span className="spinner"></span></div>;
        return adminUser ? <AdminDashboard adminUser={adminUser} /> : <AdminLogin />;
      default:             return <HomePage navigate={navigate} />;
    }
  };

  return (
    <>
      <Navbar page={page} navigate={navigate} adminUser={adminUser} pendingCount={pendingCount} />
      <main style={{ flex: 1 }}>{renderPage()}</main>
      {/* Improvement #4: Professional footer */}
      <Footer navigate={navigate} />
      {/* Improvement #16: Back to top */}
      <BackToTop />
    </>
  );
}

// Improvement #4: Footer component
function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo.png" alt="Digital Trash Can" className="footer-logo" />
          <span className="footer-brand-name">Digital Trash Can</span>
        </div>
        <div className="footer-links">
          <button className="footer-link" onClick={() => navigate('submit')}>Submit Recyclables</button>
          <button className="footer-link" onClick={() => navigate('request')}>Request Materials</button>
          <button className="footer-link" onClick={() => navigate('announcements')}>Announcements</button>
          <button className="footer-link" onClick={() => navigate('feedback')}>Feedback</button>
        </div>
        <p className="footer-copy">&copy; {new Date().getFullYear()} Digital Trash Can. All rights reserved.</p>
      </div>
    </footer>
  );
}

// ── Live stats bar on home page ──────────────────────────────
function useLiveStats() {
  const [stats, setStats] = useState({ totalQty: 0, contributors: 0, pending: 0 });

  useEffect(() => {
    const unsubs = [];
    unsubs.push(
      onSnapshot(collection(db, 'recyclables'), (snap) => {
        const docs = snap.docs.map((d) => d.data());
        const totalQty = docs.reduce((s, d) => s + (d.quantity || 0), 0);
        const contributors = new Set(docs.map((d) => d.name)).size;
        setStats((s) => ({ ...s, totalQty, contributors }));
      })
    );
    unsubs.push(
      onSnapshot(collection(db, 'requests'), (snap) => {
        const pending = snap.docs.filter((d) => d.data().status === 'Pending').length;
        setStats((s) => ({ ...s, pending }));
      })
    );
    return () => unsubs.forEach((u) => u());
  }, []);

  return stats;
}

function HomePage({ navigate }) {
  const stats = useLiveStats();

  return (
    <div className="page-wrapper">
      <div className="home-hero">
        <h1 className="home-title">Digital Trash Can</h1>
        <p className="home-sub">
          A platform for students, teachers, and staff to recycle responsibly,
          share craft materials, and stay informed.
        </p>
        <div className="home-actions">
          <button className="btn btn-primary" onClick={() => navigate('submit')}>
            Submit Recyclables
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('request')}>
            Request Materials
          </button>
        </div>
      </div>

      {/* Live stats strip */}
      <div className="stats-strip">
        <div className="stats-item">
          <div className="stats-val">{stats.totalQty}</div>
          <div className="stats-lbl">Units Collected</div>
        </div>
        <div className="stats-divider" />
        <div className="stats-item">
          <div className="stats-val">{stats.contributors}</div>
          <div className="stats-lbl">Contributors</div>
        </div>
        <div className="stats-divider" />
        <div className="stats-item">
          <div className="stats-val">{stats.pending}</div>
          <div className="stats-lbl">Pending Requests</div>
        </div>
      </div>

      <div className="home-cards">
        <div className="home-card" onClick={() => navigate('submit')}>
          <div className="home-card-icon green">R</div>
          <h3>Submit Recyclables</h3>
          <p>Drop off paper, plastic, cardboard and more. Upload a photo to log your contribution.</p>
        </div>
        <div className="home-card" onClick={() => navigate('request')}>
          <div className="home-card-icon blue">M</div>
          <h3>Request Materials</h3>
          <p>Need materials for an arts and crafts project? Put in a request and track its status.</p>
        </div>
        <div className="home-card" onClick={() => navigate('announcements')}>
          <div className="home-card-icon teal">A</div>
          <h3>Announcements</h3>
          <p>Stay up to date with the latest news and updates from the school community.</p>
        </div>
        <div className="home-card" onClick={() => navigate('feedback')}>
          <div className="home-card-icon gray">F</div>
          <h3>Give Feedback</h3>
          <p>Share how useful this platform is and suggest improvements.</p>
        </div>
      </div>

      <style>{`
        .home-hero {
          text-align: center;
          padding: 3rem 1rem 2rem;
        }
        .home-title {
          font-size: 2.5rem;
          color: var(--green-main);
          margin-bottom: 1rem;
        }
        .home-sub {
          color: var(--gray-600);
          font-size: 1.0625rem;
          max-width: 560px;
          margin: 0 auto 1.75rem;
          line-height: 1.7;
        }
        .home-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .stats-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 1.25rem 2rem;
          margin: 1.5rem 0 2rem;
          box-shadow: var(--shadow-sm);
        }
        .stats-item {
          flex: 1;
          text-align: center;
        }
        .stats-val {
          font-size: 2rem;
          font-weight: 700;
          color: var(--green-main);
          line-height: 1.2;
        }
        .stats-lbl {
          font-size: 0.8125rem;
          color: var(--gray-600);
          margin-top: 0.2rem;
        }
        .stats-divider {
          width: 1px;
          height: 40px;
          background: var(--gray-200);
          margin: 0 1rem;
          flex-shrink: 0;
        }
        .home-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
        }
        .home-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s;
        }
        .home-card:hover {
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .home-card h3 {
          margin: 0.75rem 0 0.5rem;
          font-size: 1rem;
          color: var(--gray-900);
        }
        .home-card p {
          font-size: 0.875rem;
          color: var(--gray-600);
          line-height: 1.55;
        }
        .home-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--white);
        }
        .home-card-icon.green { background: var(--green-main); }
        .home-card-icon.blue  { background: var(--blue-main); }
        .home-card-icon.teal  { background: var(--green-mid); }
        .home-card-icon.gray  { background: var(--gray-500); }
        @media (max-width: 500px) {
          .home-title { font-size: 1.75rem; }
          .stats-strip { padding: 1rem; gap: 0; }
          .stats-val { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}

export default App;
