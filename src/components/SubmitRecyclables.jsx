// Submit Recyclables page
// Allows users to log recyclable materials with optional photo upload
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const RECYCLABLE_TYPES = ['Paper', 'Plastic', 'Cardboard', 'Others'];

function SubmitRecyclables() {
  const [form, setForm] = useState({
    name: '',
    gradeClass: '',
    type: '',
    quantity: '',
  });
  const [photo, setPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required.';
    if (!form.gradeClass.trim()) e.gradeClass = 'Grade/Class is required.';
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let photoUrl = null;

      // Upload photo to Firebase Storage if provided
      if (photo) {
        const storageRef = ref(storage, `recyclables/${Date.now()}_${photo.name}`);
        await uploadBytes(storageRef, photo);
        photoUrl = await getDownloadURL(storageRef);
      }

      // Save submission to Firestore
      await addDoc(collection(db, 'recyclables'), {
        name: form.name.trim(),
        gradeClass: form.gradeClass.trim(),
        type: form.type,
        quantity: Number(form.quantity),
        photoUrl,
        submittedAt: serverTimestamp(),
      });

      setMessage({ type: 'success', text: 'Your submission has been recorded. Thank you!' });
      setForm({ name: '', gradeClass: '', type: '', quantity: '' });
      setPhoto(null);
      // Reset file input
      const fileInput = document.getElementById('photo-input');
      if (fileInput) fileInput.value = '';
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

      <div className="form-card">
        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Maria Santos"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gradeClass">Grade / Class</label>
              <input
                id="gradeClass"
                name="gradeClass"
                type="text"
                placeholder="e.g. Grade 5 - Section A"
                value={form.gradeClass}
                onChange={handleChange}
              />
              {errors.gradeClass && <span className="field-error">{errors.gradeClass}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type of Recyclable</label>
              <select id="type" name="type" value={form.type} onChange={handleChange}>
                <option value="">-- Select type --</option>
                {RECYCLABLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.type && <span className="field-error">{errors.type}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity (pieces / kg)</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={form.quantity}
                onChange={handleChange}
              />
              {errors.quantity && <span className="field-error">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photo-input">Photo (optional, max 5 MB)</label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhoto}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Recyclables'}
          </button>
        </form>
      </div>

      <style>{`
        .field-error {
          display: block;
          color: var(--red);
          font-size: 0.8125rem;
          margin-top: 0.3rem;
        }
      `}</style>
    </div>
  );
}

export default SubmitRecyclables;
