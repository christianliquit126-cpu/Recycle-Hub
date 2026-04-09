// Improvement #2: Address field
// Improvement #6: Photo preview before upload
// Improvement #7: Auto-dismiss success alert
// Improvement #19: CSS loading spinner
import { useState, useEffect, useRef } from 'react';
import {
  collection, addDoc, onSnapshot,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const RECYCLABLE_TYPES = ['Paper', 'Plastic', 'Cardboard', 'Others'];

function useLeaderboard() {
  const [leaders, setLeaders] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'recyclables'), (snap) => {
      const totals = {};
      snap.docs.forEach((d) => {
        const { name, quantity } = d.data();
        if (!name) return;
        totals[name] = (totals[name] || 0) + (quantity || 0);
      });
      const sorted = Object.entries(totals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, qty }));
      setLeaders(sorted);
    });
    return unsub;
  }, []);

  return leaders;
}

function SubmitRecyclables() {
  const [form, setForm] = useState({
    name: '', gradeClass: '', address: '', type: '', quantity: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // Improvement #6
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const leaders = useLeaderboard();
  const dismissTimer = useRef(null);

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
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.gradeClass.trim()) e.gradeClass = 'Grade/Class is required.';
    if (!form.address.trim()) e.address = 'Address is required.';
    if (!form.type) e.type = 'Please select a type.';
    if (!form.quantity || isNaN(form.quantity) || Number(form.quantity) <= 0)
      e.quantity = 'Enter a valid quantity.';
    return e;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((err) => ({ ...err, [e.target.name]: undefined }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Photo must be under 5 MB.' });
      return;
    }
    setPhoto(file || null);
    // Improvement #6: generate preview URL
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    } else {
      setPhotoPreview(null);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    const fileInput = document.getElementById('photo-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      let photoUrl = null;
      if (photo) {
        const storageRef = ref(storage, `recyclables/${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }
      await addDoc(collection(db, 'recyclables'), {
        name: form.name.trim(),
        gradeClass: form.gradeClass.trim(),
        address: form.address.trim(),
        type: form.type,
        quantity: Number(form.quantity),
        photoUrl,
        submittedAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'Your submission has been recorded. Thank you!' });
      setForm({ name: '', gradeClass: '', address: '', type: '', quantity: '' });
      clearPhoto();
    } catch (err) {
      console.error('Submit error:', err);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Submit Recyclables</h1>
        <p>Log your recyclable materials to contribute to the school's sustainability goals.</p>
      </div>

      <div className="submit-layout">
        {/* Form */}
        <div className="form-card">
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text"
                  placeholder="e.g. Maria Santos" value={form.name} onChange={handleChange} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="gradeClass">Grade / Class</label>
                <input id="gradeClass" name="gradeClass" type="text"
                  placeholder="e.g. Grade 5 - Section A" value={form.gradeClass} onChange={handleChange} />
                {errors.gradeClass && <span className="field-error">{errors.gradeClass}</span>}
              </div>
            </div>

            {/* Improvement #2: Address field */}
            <div className="form-group">
              <label htmlFor="address">Home Address</label>
              <input id="address" name="address" type="text"
                placeholder="e.g. 123 Mabini St., Brgy. San Jose, Manila"
                value={form.address} onChange={handleChange} />
              {errors.address && <span className="field-error">{errors.address}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type of Recyclable</label>
                <select id="type" name="type" value={form.type} onChange={handleChange}>
                  <option value="">-- Select type --</option>
                  {RECYCLABLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.type && <span className="field-error">{errors.type}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="quantity">Quantity (pieces / kg)</label>
                <input id="quantity" name="quantity" type="number" min="1"
                  placeholder="e.g. 10" value={form.quantity} onChange={handleChange} />
                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="photo-input">Photo (optional, max 5 MB)</label>
              <input id="photo-input" type="file" accept="image/*" onChange={handlePhoto} />
              {/* Improvement #6: photo preview */}
              {photoPreview && (
                <div className="photo-preview-wrap">
                  <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                  <button type="button" className="photo-preview-remove" onClick={clearPhoto}>
                    Remove
                  </button>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {/* Improvement #19: spinner inside button */}
              {submitting ? (
                <><span className="spinner spinner-sm"></span> Submitting...</>
              ) : 'Submit Recyclables'}
            </button>
          </form>
        </div>

        {/* Top Contributors leaderboard */}
        <div className="leaderboard-card">
          <h3 className="lb-title">Top Contributors</h3>
          {leaders.length === 0 ? (
            <p className="lb-empty">No submissions yet. Be the first!</p>
          ) : (
            <ol className="lb-list">
              {leaders.map((l, i) => (
                <li key={l.name} className="lb-item">
                  <span className={`lb-rank rank-${i + 1}`}>{i + 1}</span>
                  <span className="lb-name">{l.name}</span>
                  <span className="lb-qty">{l.qty} units</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <style>{`
        .field-error { display: block; color: var(--red); font-size: 0.8125rem; margin-top: 0.3rem; }
        .submit-layout {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 1.5rem;
          align-items: start;
        }
        .leaderboard-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 80px;
        }
        .lb-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--green-main);
          margin-bottom: 1rem;
          padding-bottom: 0.625rem;
          border-bottom: 1px solid var(--gray-200);
        }
        .lb-empty { font-size: 0.875rem; color: var(--gray-500); }
        .lb-list { list-style: none; display: flex; flex-direction: column; gap: 0.625rem; }
        .lb-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }
        .lb-rank {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
          background: var(--gray-200);
          color: var(--gray-700);
        }
        .lb-rank.rank-1 { background: #f4c542; color: #7d5a00; }
        .lb-rank.rank-2 { background: #c0c0c0; color: #444; }
        .lb-rank.rank-3 { background: #cd7f32; color: #fff; }
        .lb-name { flex: 1; font-weight: 500; color: var(--gray-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .lb-qty { font-size: 0.8125rem; color: var(--gray-500); white-space: nowrap; }
        /* Improvement #6: photo preview */
        .photo-preview-wrap {
          margin-top: 0.75rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }
        .photo-preview-img {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: var(--radius);
          border: 1px solid var(--gray-200);
        }
        .photo-preview-remove {
          background: none;
          border: 1px solid var(--gray-300);
          border-radius: var(--radius);
          padding: 0.25rem 0.625rem;
          font-size: 0.8125rem;
          color: var(--red);
          cursor: pointer;
          transition: background 0.15s;
        }
        .photo-preview-remove:hover { background: var(--red-pale); }
        @media (max-width: 700px) {
          .submit-layout { grid-template-columns: 1fr; }
          .leaderboard-card { position: static; }
        }
      `}</style>
    </div>
  );
}

export default SubmitRecyclables;
