// Request Materials page
// Users can request recyclable materials for arts and crafts projects
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

function RequestMaterials() {
  const [form, setForm] = useState({
    name: '',
    gradeClass: '',
    materials: '',
    quantity: '',
    purpose: '',
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  // Real-time listener for requests
  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('submittedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.gradeClass.trim()) e.gradeClass = 'Grade/Class is required.';
    if (!form.materials.trim()) e.materials = 'Materials needed is required.';
    if (!form.quantity.trim()) e.quantity = 'Quantity is required.';
    if (!form.purpose.trim()) e.purpose = 'Project description is required.';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
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
        materials: form.materials.trim(),
        quantity: form.quantity.trim(),
        purpose: form.purpose.trim(),
        status: 'Pending',
        submittedAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'Your request has been submitted.' });
      setForm({ name: '', gradeClass: '', materials: '', quantity: '', purpose: '' });
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

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Request Materials</h1>
        <p>Request recyclable materials for arts and crafts or classroom projects.</p>
      </div>

      {/* Request form */}
      <div className="form-card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.25rem', color: 'var(--green-main)' }}>New Request</h2>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="req-name">Full Name</label>
              <input
                id="req-name"
                name="name"
                type="text"
                placeholder="e.g. Juan dela Cruz"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="req-class">Grade / Class</label>
              <input
                id="req-class"
                name="gradeClass"
                type="text"
                placeholder="e.g. Grade 4 - Section B"
                value={form.gradeClass}
                onChange={handleChange}
              />
              {errors.gradeClass && <span className="field-error">{errors.gradeClass}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="req-materials">Materials Needed</label>
              <input
                id="req-materials"
                name="materials"
                type="text"
                placeholder="e.g. Cardboard sheets, plastic bottles"
                value={form.materials}
                onChange={handleChange}
              />
              {errors.materials && <span className="field-error">{errors.materials}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="req-quantity">Quantity</label>
              <input
                id="req-quantity"
                name="quantity"
                type="text"
                placeholder="e.g. 20 sheets"
                value={form.quantity}
                onChange={handleChange}
              />
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="req-purpose">Purpose / Project Description</label>
            <textarea
              id="req-purpose"
              name="purpose"
              placeholder="Describe what the materials will be used for..."
              value={form.purpose}
              onChange={handleChange}
            />
            {errors.purpose && <span className="field-error">{errors.purpose}</span>}
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Request list */}
      <div className="card">
        <h2 style={{ marginBottom: '1.25rem', color: 'var(--green-main)' }}>My Requests</h2>
        {loading ? (
          <div className="loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="empty-state"><p>No requests have been submitted yet.</p></div>
        ) : (
          <div className="request-list">
            {requests.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-top">
                  <div>
                    <strong>{req.name}</strong>
                    <span className="req-class">{req.gradeClass}</span>
                  </div>
                  <span className={`badge badge-${req.status?.toLowerCase()}`}>{req.status}</span>
                </div>
                <div className="request-details">
                  <span><strong>Materials:</strong> {req.materials}</span>
                  <span><strong>Qty:</strong> {req.quantity}</span>
                </div>
                <p className="request-purpose">{req.purpose}</p>
                <div className="request-date">{formatDate(req.submittedAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .field-error {
          display: block;
          color: var(--red);
          font-size: 0.8125rem;
          margin-top: 0.3rem;
        }
        .request-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .request-item {
          border: 1px solid var(--gray-200);
          border-radius: var(--radius);
          padding: 1rem 1.125rem;
          background: var(--gray-50);
        }
        .request-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          gap: 0.5rem;
        }
        .req-class {
          display: block;
          font-size: 0.8125rem;
          color: var(--gray-600);
          margin-top: 0.1rem;
        }
        .request-details {
          display: flex;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: var(--gray-700);
          margin-bottom: 0.4rem;
          flex-wrap: wrap;
        }
        .request-purpose {
          font-size: 0.875rem;
          color: var(--gray-600);
          margin-bottom: 0.5rem;
        }
        .request-date {
          font-size: 0.8rem;
          color: var(--gray-500);
        }
      `}</style>
    </div>
  );
}

export default RequestMaterials;
