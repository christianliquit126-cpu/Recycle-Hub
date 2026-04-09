// Announcements page
// Displays admin-posted announcements in real time
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener for announcements collection
  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('postedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay informed with the latest updates from the school administration.</p>
      </div>

      {loading ? (
        <div className="loading">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="empty-state card">
          <p>No announcements have been posted yet. Check back soon.</p>
        </div>
      ) : (
        <div className="ann-list">
          {announcements.map((ann) => (
            <div key={ann.id} className="ann-card">
              <div className="ann-header">
                <h2 className="ann-title">{ann.title}</h2>
                <span className="ann-date">{formatDate(ann.postedAt)}</span>
              </div>
              {ann.category && (
                <span className="ann-category">{ann.category}</span>
              )}
              <p className="ann-body">{ann.body}</p>
              {ann.postedBy && (
                <div className="ann-author">Posted by {ann.postedBy}</div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .ann-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .ann-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-left: 4px solid var(--green-main);
          border-radius: var(--radius-lg);
          padding: 1.5rem 1.75rem;
          box-shadow: var(--shadow-sm);
        }
        .ann-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }
        .ann-title {
          font-size: 1.125rem;
          color: var(--green-dark);
          flex: 1;
        }
        .ann-date {
          font-size: 0.8125rem;
          color: var(--gray-500);
          white-space: nowrap;
          margin-top: 0.2rem;
        }
        .ann-category {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--green-accent);
          background: var(--green-pale);
          border-radius: 4px;
          padding: 0.15rem 0.5rem;
          margin-bottom: 0.75rem;
        }
        .ann-body {
          color: var(--gray-700);
          font-size: 0.9375rem;
          line-height: 1.65;
          white-space: pre-wrap;
          margin-bottom: 0.75rem;
        }
        .ann-author {
          font-size: 0.8125rem;
          color: var(--gray-500);
          font-style: italic;
        }
        @media (max-width: 500px) {
          .ann-header { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

export default Announcements;
