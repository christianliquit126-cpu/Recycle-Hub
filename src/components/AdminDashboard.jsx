// Improvement #10: Search filter in submissions tab
// Improvement #11: Search filter in requests tab
// Improvement #12: Export requests as CSV
// Improvement #13: Inline delete confirmation (no window.confirm)
// Improvement #15: Photo lightbox modal
// Improvement #18: Status notes when changing request status
// Improvement #19: CSS loading spinner
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

// CSV export helper for recyclables
function exportRecyclablesCSV(data) {
  const headers = ['Name', 'Grade/Class', 'Address', 'Type', 'Quantity', 'Date'];
  const rows = data.map((r) => [
    r.name, r.gradeClass, r.address || '', r.type, r.quantity,
    r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toLocaleDateString() : '',
  ]);
  downloadCSV([headers, ...rows], 'recyclables.csv');
}

// Improvement #12: CSV export for requests
function exportRequestsCSV(data) {
  const headers = ['Name', 'Grade/Class', 'Address', 'Materials', 'Quantity', 'Purpose', 'Status', 'Date'];
  const rows = data.map((r) => [
    r.name, r.gradeClass, r.address || '', r.materials, r.quantity, r.purpose, r.status,
    r.submittedAt ? new Date(r.submittedAt.seconds * 1000).toLocaleDateString() : '',
  ]);
  downloadCSV([headers, ...rows], 'requests.csv');
}

function downloadCSV(rows, filename) {
  const csv = rows.map((row) =>
    row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Improvement #13: Inline confirm component
function InlineConfirm({ onConfirm, onCancel, label = 'Confirm Delete' }) {
  return (
    <span className="inline-confirm">
      <span className="inline-confirm-label">Delete?</span>
      <button className="btn btn-sm btn-danger" onClick={onConfirm}>{label}</button>
      <button className="btn btn-sm btn-secondary" onClick={onCancel}>Cancel</button>
    </span>
  );
}

// Improvement #15: Photo lightbox
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Submission photo" className="lightbox-img" />
        <button className="lightbox-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
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

  // Improvement #10: submissions search
  const [subSearch, setSubSearch] = useState('');
  // Improvement #11: requests search
  const [reqSearch, setReqSearch] = useState('');
  // Improvement #13: pending delete confirmations
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Improvement #15: lightbox
  const [lightboxSrc, setLightboxSrc] = useState(null);
  // Improvement #18: status notes
  const [statusNote, setStatusNote] = useState({});
  const [noteInput, setNoteInput] = useState('');
  const [noteTarget, setNoteTarget] = useState(null);

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

  // Improvement #18: update status with optional note
  const updateRequestStatus = async (id, status) => {
    const note = noteTarget === id ? noteInput.trim() : '';
    const update = { status };
    if (note) update.adminNote = note;
    await updateDoc(doc(db, 'requests', id), update);
    if (noteTarget === id) { setNoteTarget(null); setNoteInput(''); }
  };

  // Improvement #13: inline delete flow
  const handleDeleteRecyclable = (id) => {
    setDeleteConfirm({ type: 'recyclable', id });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'recyclable') {
      await deleteDoc(doc(db, 'recyclables', deleteConfirm.id));
    } else if (deleteConfirm.type === 'announcement') {
      await deleteDoc(doc(db, 'announcements', deleteConfirm.id));
    }
    setDeleteConfirm(null);
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

  // Improvement #10: filtered submissions
  const filteredSubs = subSearch.trim()
    ? recyclables.filter((r) =>
        r.name?.toLowerCase().includes(subSearch.toLowerCase()) ||
        r.type?.toLowerCase().includes(subSearch.toLowerCase()) ||
        r.gradeClass?.toLowerCase().includes(subSearch.toLowerCase())
      )
    : recyclables;

  // Improvement #11: filtered requests
  const filteredReqs = reqSearch.trim()
    ? requests.filter((r) =>
        r.name?.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.materials?.toLowerCase().includes(reqSearch.toLowerCase()) ||
        r.gradeClass?.toLowerCase().includes(reqSearch.toLowerCase())
      )
    : requests;

  if (loading) return <div className="loading"><span className="spinner"></span></div>;

  const TABS = ['overview', 'submissions', 'requests', 'announcements', 'feedback'];

  return (
    <div className="page-wrapper dash-wrapper">
      {/* Improvement #15: Photo lightbox */}
      <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />

      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Logged in as {adminUser?.email}</p>
      </div>

      <div className="dash-tabs">
        {TABS.map((t) => (
          <button key={t} className={`dash-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'requests' && pendingRequests > 0 && (
              <span className="tab-badge">{pendingRequests}</span>
            )}
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

      {/* Submissions tab */}
      {tab === 'submissions' && (
        <div className="dash-content">
          <div className="submissions-header">
            <h2 style={{ color: 'var(--green-main)' }}>Recyclable Submissions</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Improvement #10: search */}
              <input
                type="text"
                className="table-search"
                placeholder="Search by name, type, class..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => exportRecyclablesCSV(recyclables)}
                disabled={recyclables.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="empty-state card">
              <p>{subSearch ? 'No results found.' : 'No submissions yet.'}</p>
            </div>
          ) : (
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade/Class</th>
                    <th>Address</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Photo</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.gradeClass}</td>
                      <td className="addr-cell">{r.address || '-'}</td>
                      <td>{r.type}</td>
                      <td>{r.quantity}</td>
                      <td>
                        {r.photoUrl ? (
                          /* Improvement #15: click to open lightbox */
                          <button className="photo-link-btn" onClick={() => setLightboxSrc(r.photoUrl)}>
                            View
                          </button>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>None</span>
                        )}
                      </td>
                      <td className="req-date-cell">{formatDate(r.submittedAt)}</td>
                      <td>
                        {/* Improvement #13: inline confirm */}
                        {deleteConfirm?.type === 'recyclable' && deleteConfirm?.id === r.id ? (
                          <InlineConfirm
                            onConfirm={confirmDelete}
                            onCancel={() => setDeleteConfirm(null)}
                          />
                        ) : (
                          <button className="btn btn-sm btn-danger" onClick={() => handleDeleteRecyclable(r.id)}>
                            Delete
                          </button>
                        )}
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
          <div className="submissions-header">
            <h2 style={{ color: 'var(--green-main)' }}>Material Requests</h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Improvement #11: search */}
              <input
                type="text"
                className="table-search"
                placeholder="Search by name, material, class..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
              />
              {/* Improvement #12: export requests CSV */}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => exportRequestsCSV(requests)}
                disabled={requests.length === 0}
              >
                Export CSV
              </button>
            </div>
          </div>

          {filteredReqs.length === 0 ? (
            <div className="empty-state card">
              <p>{reqSearch ? 'No results found.' : 'No requests submitted yet.'}</p>
            </div>
          ) : (
            <div className="requests-table-wrap">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Class</th><th>Address</th><th>Materials</th>
                    <th>Qty</th><th>Status</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReqs.map((req) => (
                    <tr key={req.id}>
                      <td>{req.name}</td>
                      <td>{req.gradeClass}</td>
                      <td className="addr-cell">{req.address || '-'}</td>
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
                          {/* Improvement #18: note toggle */}
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => {
                              setNoteTarget(noteTarget === req.id ? null : req.id);
                              setNoteInput(req.adminNote || '');
                            }}
                          >
                            Note
                          </button>
                        </div>
                        {/* Improvement #18: note input row */}
                        {noteTarget === req.id && (
                          <div className="note-input-row">
                            <input
                              type="text"
                              className="note-input"
                              placeholder="Add internal note..."
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                            />
                          </div>
                        )}
                        {req.adminNote && noteTarget !== req.id && (
                          <div className="admin-note-display">{req.adminNote}</div>
                        )}
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
                <div className="char-counter">{annForm.body.length} / {ANN_BODY_MAX}</div>
                {annErrors.body && <span className="field-error">{annErrors.body}</span>}
              </div>
              <button className="btn btn-primary" type="submit" disabled={annSubmitting}>
                {annSubmitting ? (
                  <><span className="spinner spinner-sm"></span> Posting...</>
                ) : 'Post Announcement'}
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
                    {/* Improvement #13: inline delete for announcements */}
                    {deleteConfirm?.type === 'announcement' && deleteConfirm?.id === ann.id ? (
                      <InlineConfirm
                        onConfirm={confirmDelete}
                        onCancel={() => setDeleteConfirm(null)}
                      />
                    ) : (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => setDeleteConfirm({ type: 'announcement', id: ann.id })}
                      >
                        Delete
                      </button>
                    )}
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
          margin-bottom: -2px; transition: color 0.15s, border-color 0.15s;
          white-space: nowrap; display: flex; align-items: center; gap: 0.4rem;
        }
        .dash-tab:hover { color: var(--green-main); }
        .dash-tab.active { color: var(--green-main); border-bottom-color: var(--green-main); font-weight: 600; }
        .tab-badge {
          background: var(--orange); color: #fff;
          font-size: 0.65rem; font-weight: 700; border-radius: 999px;
          padding: 0.1rem 0.4rem; min-width: 18px; text-align: center; line-height: 1.4;
        }
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
        .submissions-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
        }
        /* Improvement #10/#11: table search input */
        .table-search {
          width: 220px;
          font-size: 0.875rem;
          padding: 0.375rem 0.75rem;
          border: 1.5px solid var(--gray-300);
          border-radius: var(--radius);
          outline: none;
          transition: border-color 0.2s;
        }
        .table-search:focus { border-color: var(--green-mid); }
        .photo-link-btn {
          background: none; border: none; color: var(--blue-main);
          font-size: 0.875rem; text-decoration: underline; cursor: pointer; padding: 0;
        }
        .photo-link-btn:hover { color: var(--blue-dark); }
        .addr-cell { font-size: 0.8125rem; color: var(--gray-600); max-width: 160px; }
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
        /* Improvement #13: inline confirm */
        .inline-confirm { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
        .inline-confirm-label { font-size: 0.8125rem; color: var(--red); font-weight: 600; }
        /* Improvement #18: note input */
        .note-input-row { margin-top: 0.5rem; }
        .note-input {
          width: 100%; font-size: 0.8125rem;
          padding: 0.35rem 0.65rem;
          border: 1.5px solid var(--gray-300);
          border-radius: var(--radius);
          outline: none;
        }
        .note-input:focus { border-color: var(--green-mid); }
        .admin-note-display {
          margin-top: 0.35rem; font-size: 0.8rem;
          color: var(--gray-600); font-style: italic;
          background: var(--gray-100); border-radius: 4px; padding: 0.25rem 0.5rem;
        }
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
        /* Improvement #15: Lightbox */
        .lightbox-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75);
          z-index: 1000; display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
        }
        .lightbox-content {
          background: var(--white); border-radius: var(--radius-lg);
          padding: 1rem; max-width: 90vw; max-height: 90vh;
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .lightbox-img {
          max-width: 100%; max-height: 70vh; object-fit: contain;
          border-radius: var(--radius);
        }
        .lightbox-close {
          background: var(--green-main); color: var(--white); border: none;
          border-radius: var(--radius); padding: 0.5rem 1.5rem;
          font-size: 0.9375rem; font-weight: 500; cursor: pointer;
        }
        .lightbox-close:hover { background: var(--green-dark); }
        @media (max-width: 600px) {
          .feedback-stats { grid-template-columns: 1fr 1fr; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .table-search { width: 100%; }
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
