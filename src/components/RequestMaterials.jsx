// Improvement #3: Address field
// Improvement #7: Auto-dismiss success alert
// Improvement #14: Relative time display
// Improvement #20: Print requests list
import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const PURPOSE_MAX = 300;
const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Fulfilled'];

// Improvement #14: relative time helper
function relativeTime(ts) {
  if (!ts) return '';
  const now = Date.now();
  const then = ts.seconds * 1000;
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function RequestMaterials() {
  const [form, setForm] = useState({
    name: '', gradeClass: '', address: '', materials: '', quantity: '', purpose: '',
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const dismissTimer = useRef(null);

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  // Improvement #7: auto-dismiss success alert
  useEffect(() => {
    if (message?.type === 'success') {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setMessage(null), 4000);
    }
    return () => clearTimeout(dismissTimer.current);
  }, [message]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name = 'Name is required.';
    if (!form.gradeClass.trim()) e.gradeClass = 'Grade/Class is required.';
    if (!form.address.trim())   e.address = 'Address is required.';
    if (!form.materials.trim()) e.materials = 'Materials needed is required.';
    if (!form.quantity.trim())  e.quantity = 'Quantity is required.';
    if (!form.purpose.trim())   e.purpose = 'Project description is required.';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'purpose' && value.length > PURPOSE_MAX) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      await addDoc(collection(db, 'requests'), {
        name: form.name.trim(),
        gradeClass: form.gradeClass.trim(),
        address: form.address.trim(),
        materials: form.materials.trim(),
        quantity: form.quantity.trim(),
        purpose: form.purpose.trim(),
        status: 'Pending',
        submittedAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'Your request has been submitted.' });
      setForm({ name: '', gradeClass: '', address: '', materials: '', quantity: '', purpose: '' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to submit. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const filtered = statusFilter === 'All'
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  // Improvement #20: print requests list
  const handlePrint = () => window.print();

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Request Materials</h1>
        <p>Request recyclable materials for arts and crafts or classroom projects.</p>
      </div>

      {/* Request form */}
      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.25rem', color: 'var(--green-main)' }}>New Request</h2>
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="req-name">Full Name</label>
              <input id="req-name" name="name" type="text"
                placeholder="e.g. Juan dela Cruz" value={form.name} onChange={handleChange} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="req-class">Grade / Class</label>
              <input id="req-class" name="gradeClass" type="text"
                placeholder="e.g. Grade 4 - Section B" value={form.gradeClass} onChange={handleChange} />
              {errors.gradeClass && <span className="field-error">{errors.gradeClass}</span>}
            </div>
          </div>

          {/* Improvement #3: Address field */}
          <div className="form-group">
            <label htmlFor="req-address">Home Address</label>
            <input id="req-address" name="address" type="text"
              placeholder="e.g. 123 Mabini St., Brgy. San Jose, Manila"
              value={form.address} onChange={handleChange} />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="req-materials">Materials Needed</label>
              <input id="req-materials" name="materials" type="text"
                placeholder="e.g. Cardboard sheets, plastic bottles"
                value={form.materials} onChange={handleChange} />
              {errors.materials && <span className="field-error">{errors.materials}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="req-quantity">Quantity</label>
              <input id="req-quantity" name="quantity" type="text"
                placeholder="e.g. 20 sheets" value={form.quantity} onChange={handleChange} />
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="req-purpose">Purpose / Project Description</label>
            <textarea id="req-purpose" name="purpose"
              placeholder="Describe what the materials will be used for..."
              value={form.purpose} onChange={handleChange} />
            <div className="char-counter">
              {form.purpose.length} / {PURPOSE_MAX}
            </div>
            {errors.purpose && <span className="field-error">{errors.purpose}</span>}
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? (
              <><span className="spinner spinner-sm"></span> Submitting...</>
            ) : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request list with filter */}
      <div className="card">
        <div className="req-list-header">
          <h2 style={{ color: 'var(--green-main)' }}>All Requests</h2>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="status-filter-row">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  className={`status-filter-btn${statusFilter === s ? ' active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Improvement #20: print button */}
            <button className="btn btn-secondary btn-sm no-print" onClick={handlePrint}>
              Print
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><span className="spinner"></span></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>{statusFilter === 'All' ? 'No requests yet.' : `No ${statusFilter} requests.`}</p>
          </div>
        ) : (
          <div className="request-list">
            {filtered.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-top">
                  <div>
                    <strong>{req.name}</strong>
                    <span className="req-class">{req.gradeClass}</span>
                    {req.address && (
                      <span className="req-address">{req.address}</span>
                    )}
                  </div>
                  <span className={`badge badge-${req.status?.toLowerCase()}`}>{req.status}</span>
                </div>
                <div className="request-details">
                  <span><strong>Materials:</strong> {req.materials}</span>
                  <span><strong>Qty:</strong> {req.quantity}</span>
                </div>
                <p className="request-purpose">{req.purpose}</p>
                {/* Improvement #14: relative time */}
                <div className="request-date" title={formatDate(req.submittedAt)}>
                  {relativeTime(req.submittedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .field-error { display: block; color: var(--red); font-size: 0.8125rem; margin-top: 0.3rem; }
        .char-counter { font-size: 0.8rem; color: var(--gray-500); text-align: right; margin-top: 0.25rem; }
        .req-list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .status-filter-row { display: flex; gap: 0.375rem; flex-wrap: wrap; }
        .status-filter-btn {
          background: var(--white);
          border: 1.5px solid var(--gray-300);
          border-radius: 999px;
          padding: 0.25rem 0.875rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--gray-700);
          cursor: pointer;
          transition: all 0.15s;
        }
        .status-filter-btn:hover { border-color: var(--green-main); color: var(--green-main); }
        .status-filter-btn.active {
          background: var(--green-main);
          border-color: var(--green-main);
          color: var(--white);
        }
        .request-list { display: flex; flex-direction: column; gap: 1rem; }
        .request-item {
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          padding: 1rem 1.125rem;
          background: var(--gray-50);
        }
        .request-top {
          display: flex; justify-content: space-between;
          align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;
        }
        .req-class { display: block; font-size: 0.8125rem; color: var(--gray-600); margin-top: 0.1rem; }
        .req-address { display: block; font-size: 0.8rem; color: var(--gray-500); margin-top: 0.1rem; }
        .request-details {
          display: flex; gap: 1.5rem; font-size: 0.875rem;
          color: var(--gray-700); margin-bottom: 0.4rem; flex-wrap: wrap;
        }
        .request-purpose { font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem; }
        .request-date { font-size: 0.8rem; color: var(--gray-500); }
        @media print {
          .no-print { display: none !important; }
          .navbar, .site-footer, .back-to-top { display: none !important; }
          .form-card { display: none !important; }
          .page-wrapper { padding: 0; }
        }
      `}</style>
    </div>
  );
}

export default RequestMaterials;
