// Admin Dashboard
// Improvement #4: Delete recyclable submissions (new Submissions tab)
// Improvement #5: Character counter on announcement body
// Improvement #7: Export recyclables as CSV
import { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#2d6a4f', '#40916c', '#52b788', '#b7e4c7', '#2a8ab7'];
const ANN_BODY_MAX = 1000;

// Improvement #7: CSV export helper
function exportCSV(data) {
  const headers = ['Name', 'Grade/Class', 'Type', 'Quantity', 'Date'];
  const rows = data.map((r) => [
    r.name,
    r.gradeClass,
    r.type,
    r.quantity,
    r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toLocaleDateString() : '',
  ]);
  const csv = [headers, ...rows].map((row) =>
    row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'recyclables.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function AdminDashboard({ adminUser }) {
  const [recyclables, setRecyclables] = useState([]);
  const [requests, setRequests]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [feedback, setFeedback]       = useState([]);
  const [loading, setLoading]         = useState(true);

  const [annForm, setAnnForm]         = useState({ title: '', body: '', category: '' });
  const [annSubmitting, setAnnSubmitting] = useState(false);
  const [annMessage, setAnnMessage]   = useState(null);
  const [annErrors, setAnnErrors]     = useState({});

  const [tab, setTab] = useState('overview');

  useEffect(() => {
    const unsubs = [];
    unsubs.push(onSnapshot(query(collection(db, 'recyclables'), orderBy('submittedAt', 'desc')), (snap) => {
      setRecyclables(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }));
    unsubs.push(onSnapshot(query(collection(db, 'requests'), orderBy('submittedAt', 'desc')), (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }));
    unsubs.push(onSnapshot(query(collection(db, 'announcements'), orderBy('postedAt', 'desc')), (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }));
    unsubs.push(onSnapshot(query(collection(db, 'feedback'), orderBy('submittedAt', 'desc')), (snap) => {
      setFeedback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }));
    return () => unsubs.forEach((u) => u());
  }, []);

  // Stats
  const totalQty          = recyclables.reduce((s, r) => s + (r.quantity || 0), 0);
  const uniqueContributors = new Set(recyclables.map((r) => r.name)).size;
  const pendingRequests   = requests.filter((r) => r.status === 'Pending').length;

  const barData = ['Paper', 'Plastic', 'Cardboard', 'Others'].map((type) => ({
    type,
    count: recyclables.filter((r) => r.type === type).reduce((s, r) => s + (r.quantity || 0), 0),
  }));

  const pieData = [
    { name: 'Pending',   value: requests.filter((r) => r.status === 'Pending').length },
    { name: 'Approved',  value: requests.filter((r) => r.status === 'Approved').length },
    { name: 'Fulfilled', value: requests.filter((r) => r.status === 'Fulfilled').length },
  ].filter((d) => d.value > 0);

  const updateRequestStatus = async (id, status) => {
    await updateDoc(doc(db, 'requests', id), { status });
  };

  // Improvement #4: delete a recyclable submission
  const deleteRecyclable = async (id) => {
    if (!window.confirm('Delete this submission?')) return;
    await deleteDoc(doc(db, 'recyclables', id));
  };

  // Announcement actions
  const validateAnn = () => {
    const e = {};
    if (!annForm.title.trim()) e.title = 'Title is required.';
    if (!annForm.body.trim())  e.body  = 'Body is required.';
    return e;
  };

  const handleAnnBodyChange = (e) => {
    if (e.target.value.length > ANN_BODY_MAX) return;
    setAnnForm((f) => ({ ...f, body: e.target.value }));
  };

  const postAnnouncement = async (e) => {
    e.preventDefault();
    const errs = validateAnn();
    if (Object.keys(errs).length) { setAnnErrors(errs); return; }
    setAnnSubmitting(true);
    setAnnMessage(null);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: annForm.title.trim(),
        body: annForm.body.trim(),
        category: annForm.category.trim(),
        postedBy: adminUser?.email || 'Admin',
        postedAt: serverTimestamp(),
      });
      setAnnMessage({ type: 'success', text: 'Announcement posted.' });
      setAnnForm({ title: '', body: '', category: '' });
      setAnnErrors({});
    } catch (err) {
      console.error(err);
      setAnnMessage({ type: 'error', text: 'Failed to post announcement.' });
    } finally {
      setAnnSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    await deleteDoc(doc(db, 'announcements', id));
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const avgFeedback = (key) => {
    const vals = feedback.map((f) => f[key]).filter(Boolean);
    if (!vals.length) return 'N/A';
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;

  const TABS = ['overview', 'submissions', 'requests', 'announcements', 'feedback'];

  return (
    <div className="page-wrapper dash-wrapper">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Logged in as {adminUser?.email}</p>
      </div>

      <div className="dash-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dash-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="dash-content">
          <div className="stat-grid">
            <StatCard label="Total Recyclables Collected" value={totalQty} unit="units" color="green" />
            <StatCard label="Active Contributors" value={uniqueContributors} color="blue" />
            <StatCard label="Pending Requests" value={pendingRequests} color="orange" />
            <StatCard label="Total Submissions" value={recyclables.length} color="teal" />
          </div>
          <div className="chart-grid">
            <div className="chart-card">
              <h3>Recyclables by Type</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#40916c" radius={[4, 4, 0, 0]} name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <h3>Request Status Breakdown</h3>
              {pieData.length === 0 ? (
                <div className="empty-state"><p>No requests yet.</p></div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Improvement #4 + #7: Submissions tab */}
      {tab === 'submissions' && (
        <div className="dash-content">
          <div className="submissions-header">
            <h2 style={{ color: 'var(--green-main)' }}>Recyclable Submissions</h2>
            {/* Improvement #7: CSV export button */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => exportCSV(recyclables)}
              disabled={recyclables.length === 0}
            >
              Export CSV
            </button>
          </div>

          {recyclables.length === 0 ? (
            <div className="empty-state card"><p>No submissions yet.</p></div>
          ) : (
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade/Class</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Photo</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recyclables.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.gradeClass}</td>
                      <td>{r.type}</td>
                      <td>{r.quantity}</td>
                      <td>
                        {r.photoUrl
                          ? <a href={r.photoUrl} target="_blank" rel="noreferrer" className="photo-link">View</a>
                          : <span style={{ color: 'var(--gray-400)' }}>None</span>
                        }
                      </td>
                      <td className="req-date-cell">{formatDate(r.submittedAt)}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteRecyclable(r.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Requests tab */}
      {tab === 'requests' && (
        <div className="dash-content">
          <h2 style={{ marginBottom: '1.25rem', color: 'var(--green-main)' }}>Material Requests</h2>
          {requests.length === 0 ? (
            <div className="empty-state card"><p>No requests submitted yet.</p></div>
          ) : (
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Class</th><th>Materials</th>
                    <th>Qty</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{req.name}</td>
                      <td>{req.gradeClass}</td>
                      <td>{req.materials}</td>
                      <td>{req.quantity}</td>
                      <td>
                        <span className={`badge badge-${req.status?.toLowerCase()}`}>{req.status}</span>
                      </td>
                      <td className="req-date-cell">{formatDate(req.submittedAt)}</td>
                      <td>
                        <div className="action-btns">
                          {req.status !== 'Approved' && (
                            <button className="btn btn-sm btn-secondary"
                              onClick={() => updateRequestStatus(req.id, 'Approved')}>Approve</button>
                          )}
                          {req.status !== 'Fulfilled' && (
                            <button className="btn btn-sm btn-blue"
                              onClick={() => updateRequestStatus(req.id, 'Fulfilled')}>Fulfill</button>
                          )}
                          {req.status !== 'Pending' && (
                            <button className="btn btn-sm btn-danger"
                              onClick={() => updateRequestStatus(req.id, 'Pending')}>Reset</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Announcements tab */}
      {tab === 'announcements' && (
        <div className="dash-content">
          <div className="form-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.25rem', color: 'var(--green-main)' }}>Post Announcement</h2>
            {annMessage && <div className={`alert alert-${annMessage.type}`}>{annMessage.text}</div>}
            <form onSubmit={postAnnouncement} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ann-title">Title</label>
                  <input id="ann-title" type="text" placeholder="Announcement title"
                    value={annForm.title}
                    onChange={(e) => setAnnForm((f) => ({ ...f, title: e.target.value }))} />
                  {annErrors.title && <span className="field-error">{annErrors.title}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="ann-cat">Category (optional)</label>
                  <input id="ann-cat" type="text" placeholder="e.g. Event, Reminder, News"
                    value={annForm.category}
                    onChange={(e) => setAnnForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="ann-body">Message</label>
                <textarea id="ann-body" placeholder="Write your announcement here..."
                  value={annForm.body} onChange={handleAnnBodyChange} />
                {/* Improvement #5: character counter */}
                <div className="char-counter">{annForm.body.length} / {ANN_BODY_MAX}</div>
                {annErrors.body && <span className="field-error">{annErrors.body}</span>}
              </div>
              <button className="btn btn-primary" type="submit" disabled={annSubmitting}>
                {annSubmitting ? 'Posting...' : 'Post Announcement'}
              </button>
            </form>
          </div>

          <h2 style={{ marginBottom: '1rem', color: 'var(--green-main)' }}>Posted Announcements</h2>
          {announcements.length === 0 ? (
            <div className="empty-state card"><p>No announcements posted yet.</p></div>
          ) : (
            <div className="ann-admin-list">
              {announcements.map((ann) => (
                <div key={ann.id} className="ann-admin-card">
                  <div className="ann-admin-top">
                    <div>
                      <strong>{ann.title}</strong>
                      {ann.category && <span className="ann-cat-badge">{ann.category}</span>}
                      <div className="ann-admin-meta">{formatDate(ann.postedAt)}</div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteAnnouncement(ann.id)}>
                      Delete
                    </button>
                  </div>
                  <p className="ann-admin-body">{ann.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div className="dash-content">
          <div className="feedback-stats">
            <div className="fb-stat-card">
              <div className="fb-stat-val">{avgFeedback('usability')}</div>
              <div className="fb-stat-label">Avg Usability</div>
            </div>
            <div className="fb-stat-card">
              <div className="fb-stat-val">{avgFeedback('helpfulness')}</div>
              <div className="fb-stat-label">Avg Helpfulness</div>
            </div>
            <div className="fb-stat-card">
              <div className="fb-stat-val">{feedback.length}</div>
              <div className="fb-stat-label">Total Responses</div>
            </div>
          </div>
          <h2 style={{ margin: '1.5rem 0 1rem', color: 'var(--green-main)' }}>Recent Feedback</h2>
          {feedback.length === 0 ? (
            <div className="empty-state card"><p>No feedback submitted yet.</p></div>
          ) : (
            <div className="feedback-list">
              {feedback.map((f) => (
                <div key={f.id} className="feedback-item">
                  <div className="fb-top">
                    <strong>{f.name}</strong>
                    <span className="fb-date">{formatDate(f.submittedAt)}</span>
                  </div>
                  <div className="fb-ratings">
                    <span>Usability: <strong>{f.usability}/5</strong></span>
                    <span>Helpfulness: <strong>{f.helpfulness}/5</strong></span>
                  </div>
                  {f.suggestions && <p className="fb-suggestions">{f.suggestions}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .dash-wrapper { max-width: 1000px; }
        .dash-tabs {
          display: flex; gap: 0.375rem; margin-bottom: 1.75rem;
          border-bottom: 2px solid var(--gray-200); overflow-x: auto;
        }
        .dash-tab {
          background: none; border: none; padding: 0.625rem 1.125rem;
          font-size: 0.9375rem; font-weight: 500; color: var(--gray-600);
          cursor: pointer; border-bottom: 2px solid transparent;
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s; white-space: nowrap;
        }
        .dash-tab:hover { color: var(--green-main); }
        .dash-tab.active { color: var(--green-main); border-bottom-color: var(--green-main); font-weight: 600; }

        .stat-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1rem; margin-bottom: 1.75rem;
        }
        .stat-card {
          background: var(--white); border-radius: var(--radius-lg);
          padding: 1.25rem 1.5rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm);
        }
        .stat-card-val { font-size: 2rem; font-weight: 700; line-height: 1.2; }
        .stat-card-val.green { color: var(--green-main); }
        .stat-card-val.blue  { color: var(--blue-main); }
        .stat-card-val.orange { color: var(--orange); }
        .stat-card-val.teal  { color: var(--green-mid); }
        .stat-card-label { font-size: 0.8125rem; color: var(--gray-600); margin-top: 0.25rem; }
        .stat-card-unit  { font-size: 0.75rem; color: var(--gray-500); }

        .chart-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; }
        .chart-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg); padding: 1.25rem 1.5rem; box-shadow: var(--shadow-sm);
        }
        .chart-card h3 { font-size: 0.9375rem; color: var(--gray-700); margin-bottom: 1rem; font-weight: 600; }

        /* Submissions tab */
        .submissions-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.25rem; gap: 1rem;
        }
        .photo-link { color: var(--blue-main); font-size: 0.875rem; text-decoration: underline; }

        .requests-table-wrap { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--gray-200); }
        .requests-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .requests-table th {
          background: var(--gray-100); color: var(--gray-700); font-weight: 600;
          text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid var(--gray-200); white-space: nowrap;
        }
        .requests-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
        .requests-table tr:last-child td { border-bottom: none; }
        .requests-table tr:hover td { background: var(--gray-50); }
        .req-date-cell { color: var(--gray-500); white-space: nowrap; }
        .action-btns { display: flex; gap: 0.375rem; flex-wrap: wrap; }

        .field-error { display: block; color: var(--red); font-size: 0.8125rem; margin-top: 0.3rem; }
        .char-counter { font-size: 0.8rem; color: var(--gray-500); text-align: right; margin-top: 0.25rem; }

        .ann-admin-list { display: flex; flex-direction: column; gap: 1rem; }
        .ann-admin-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--radius); padding: 1rem 1.25rem; box-shadow: var(--shadow-xs);
        }
        .ann-admin-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 0.5rem; }
        .ann-cat-badge {
          display: inline-block; font-size: 0.75rem; font-weight: 600;
          color: var(--green-accent); background: var(--green-pale);
          border-radius: 4px; padding: 0.1rem 0.45rem; margin-left: 0.5rem;
        }
        .ann-admin-meta { font-size: 0.8rem; color: var(--gray-500); margin-top: 0.2rem; }
        .ann-admin-body { font-size: 0.875rem; color: var(--gray-600); white-space: pre-wrap; }

        .feedback-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1rem; }
        .fb-stat-card {
          background: var(--white); border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg); padding: 1.25rem; text-align: center;
        }
        .fb-stat-val { font-size: 2rem; font-weight: 700; color: var(--green-main); }
        .fb-stat-label { font-size: 0.8125rem; color: var(--gray-600); margin-top: 0.25rem; }
        .feedback-list { display: flex; flex-direction: column; gap: 1rem; }
        .feedback-item { background: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius); padding: 1rem 1.25rem; }
        .fb-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .fb-date { font-size: 0.8rem; color: var(--gray-500); }
        .fb-ratings { display: flex; gap: 1.5rem; font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.4rem; }
        .fb-suggestions { font-size: 0.875rem; color: var(--gray-600); font-style: italic; margin-top: 0.25rem; }

        @media (max-width: 600px) {
          .feedback-stats { grid-template-columns: 1fr 1fr; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, unit, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-val ${color}`}>{value}</div>
      {unit && <div className="stat-card-unit">{unit}</div>}
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

export default AdminDashboard;
