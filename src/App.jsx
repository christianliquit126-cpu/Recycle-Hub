// Main application with client-side routing via URL hash
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
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Map hash routes to page keys
function getPageFromHash() {
  const hash = window.location.hash.replace('#', '') || 'home';
  return hash;
}

function App() {
  const [page, setPage] = useState(getPageFromHash());
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen for hash changes (back/forward nav)
  useEffect(() => {
    const handler = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  // Track Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Navigate programmatically
  const navigate = (p) => {
    window.location.hash = p;
    setPage(p);
  };

  // Render current page
  const renderPage = () => {
    switch (page) {
      case 'submit':
        return <SubmitRecyclables />;
      case 'request':
        return <RequestMaterials />;
      case 'announcements':
        return <Announcements />;
      case 'feedback':
        return <Feedback />;
      case 'admin':
        if (authLoading) return <div className="loading">Loading...</div>;
        return adminUser
          ? <AdminDashboard adminUser={adminUser} />
          : <AdminLogin />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <>
      <Navbar page={page} navigate={navigate} adminUser={adminUser} />
      <main>{renderPage()}</main>
    </>
  );
}

// Home / landing page
function HomePage({ navigate }) {
  return (
    <div className="page-wrapper">
      <div className="home-hero">
        <h1 className="home-title">Digital Trashcan</h1>
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
          padding: 3rem 1rem 2.5rem;
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
        .home-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.25rem;
          margin-top: 2.5rem;
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
        .home-card-icon.blue { background: var(--blue-main); }
        .home-card-icon.teal { background: var(--green-mid); }
        .home-card-icon.gray { background: var(--gray-500); }
        @media (max-width: 500px) {
          .home-title { font-size: 1.75rem; }
        }
      `}</style>
    </div>
  );
}

export default App;
