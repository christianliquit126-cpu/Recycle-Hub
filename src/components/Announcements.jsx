// Announcements page
// Improvement #6: Read more / collapse for long announcements
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const PREVIEW_LENGTH = 200; // characters before "Read more" kicks in

function AnnouncementCard({ ann, formatDate }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = ann.body && ann.body.length > PREVIEW_LENGTH;
  const bodyText = isLong && !expanded
    ? ann.body.slice(0, PREVIEW_LENGTH).trimEnd() + '...'
    : ann.body;

  return (
    <div className="ann-card">
      <div className="ann-header">
        <h2 className="ann-title">{ann.title}</h2>
        <span className="ann-date">{formatDate(ann.postedAt)}</span>
      </div>
      {ann.category && (
        <span className="ann-category">{ann.category}</span>
      )}
      <p className="ann-body">{bodyText}</p>
      {isLong && (
        <button
          className="ann-toggle"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
      {ann.postedBy && (
        <div className="ann-author">Posted by {ann.postedBy}</div>
      )}
    </div>
  );
}

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');

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

  // Collect unique categories for filter
  const categories = [...new Set(announcements.map((a) => a.category).filter(Boolean))];

  const visible = filterCat
    ? announcements.filter((a) => a.category === filterCat)
    : announcements;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay informed with the latest updates from the school administration.</p>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="ann-filter-row">
          <button
            className={`ann-filter-btn${filterCat === '' ? ' active' : ''}`}
            onClick={() => setFilterCat('')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`ann-filter-btn${filterCat === cat ? ' active' : ''}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading announcements...</div>
      ) : visible.length === 0 ? (
        <div className="empty-state card">
          <p>No announcements found.</p>
        </div>
      ) : (
        <div className="ann-list">
          {visible.map((ann) => (
            <AnnouncementCard key={ann.id} ann={ann} formatDate={formatDate} />
          ))}
        </div>
      )}

      <style>{`
        .ann-filter-row {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .ann-filter-btn {
          background: var(--white);
          border: 1.5px solid var(--gray-300);
          border-radius: 999px;
          padding: 0.3rem 1rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.15s;
        }
        .ann-filter-btn:hover { border-color: var(--green-main); color: var(--green-main); }
        .ann-filter-btn.active {
          background: var(--green-main);
          border-color: var(--green-main);
          color: var(--white);
        }
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
          margin-bottom: 0.5rem;
        }
        .ann-toggle {
          background: none;
          border: none;
          color: var(--green-main);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-bottom: 0.75rem;
          text-decoration: underline;
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
