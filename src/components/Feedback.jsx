// Feedback page
// Improvement #5: Character counter on suggestions textarea
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const RATING_LABELS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const SUGGESTIONS_MAX = 400;

function RatingInput({ label, name, value, onChange }) {
  return (
    <div className="rating-group">
      <label>{label}</label>
      <div className="rating-options">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-btn${value === n ? ' selected' : ''}`}
            onClick={() => onChange(name, n)}
            title={RATING_LABELS[n - 1]}
          >
            {n}
          </button>
        ))}
        {value > 0 && (
          <span className="rating-label">{RATING_LABELS[value - 1]}</span>
        )}
      </div>
    </div>
  );
}

function Feedback() {
  const [form, setForm] = useState({ name: '', usability: 0, helpfulness: 0, suggestions: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'suggestions' && value.length > SUGGESTIONS_MAX) return;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const handleRating = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.usability)   e.usability = 'Please rate usability.';
    if (!form.helpfulness) e.helpfulness = 'Please rate helpfulness.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      await addDoc(collection(db, 'feedback'), {
        name: form.name.trim() || 'Anonymous',
        usability: form.usability,
        helpfulness: form.helpfulness,
        suggestions: form.suggestions.trim(),
        submittedAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'Thank you for your feedback!' });
      setForm({ name: '', usability: 0, helpfulness: 0, suggestions: '' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to submit feedback. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1>Give Feedback</h1>
        <p>Help us improve the Digital Trashcan platform. Your input matters.</p>
      </div>

      <div className="form-card">
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="fb-name">Your Name (optional)</label>
            <input id="fb-name" name="name" type="text"
              placeholder="Leave blank to submit anonymously"
              value={form.name} onChange={handleChange} />
          </div>

          <RatingInput label="How easy is the platform to use? (Usability)"
            name="usability" value={form.usability} onChange={handleRating} />
          {errors.usability && <span className="field-error">{errors.usability}</span>}

          <RatingInput label="How helpful is this platform? (Helpfulness)"
            name="helpfulness" value={form.helpfulness} onChange={handleRating} />
          {errors.helpfulness && <span className="field-error">{errors.helpfulness}</span>}

          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="fb-suggestions">Suggestions or Comments</label>
            <textarea id="fb-suggestions" name="suggestions"
              placeholder="Any suggestions to improve this platform?"
              value={form.suggestions} onChange={handleChange} />
            {/* Improvement #5: character counter */}
            <div className="char-counter">
              {form.suggestions.length} / {SUGGESTIONS_MAX}
            </div>
          </div>

          <button className="btn btn-primary btn-full" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>

      <style>{`
        .field-error {
          display: block; color: var(--red);
          font-size: 0.8125rem; margin-top: 0.3rem; margin-bottom: 0.75rem;
        }
        .char-counter { font-size: 0.8rem; color: var(--gray-500); text-align: right; margin-top: 0.25rem; }
        .rating-group { margin-bottom: 1rem; }
        .rating-group label { margin-bottom: 0.5rem; }
        .rating-options { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .rating-btn {
          width: 40px; height: 40px; border-radius: 8px;
          border: 1.5px solid var(--gray-300); background: var(--white);
          font-size: 0.9375rem; font-weight: 600; color: var(--gray-700);
          cursor: pointer; transition: all 0.15s;
        }
        .rating-btn:hover { border-color: var(--green-main); color: var(--green-main); }
        .rating-btn.selected { background: var(--green-main); border-color: var(--green-main); color: var(--white); }
        .rating-label { font-size: 0.875rem; color: var(--green-main); font-weight: 500; margin-left: 0.25rem; }
      `}</style>
    </div>
  );
}

export default Feedback;
