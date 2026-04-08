import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Toast from "../components/Toast";

export default function SubmitMaterials() {
  const [name, setName] = useState("");
  const [gradeClass, setGradeClass] = useState("");
  const [type, setType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setToast({ message: "Photo must be under 2MB", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        setPhotoBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gradeClass || !type || !quantity) {
      setToast({ message: "Please fill in all required fields", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "submissions"), {
        name,
        gradeClass,
        type,
        quantity: parseInt(quantity, 10),
        photo: photoBase64 || null,
        createdAt: serverTimestamp(),
      });

      setName("");
      setGradeClass("");
      setType("");
      setQuantity("");
      setPhotoPreview(null);
      setPhotoBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setToast({ message: "Materials submitted successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to submit. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Submit Recyclable Materials</h1>
        <p>Help the environment by submitting your recyclable materials for collection.</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="gradeClass">Grade / Class *</label>
              <input
                id="gradeClass"
                type="text"
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="e.g. Grade 10 - Section A"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="type">Type of Recyclable *</label>
              <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="">Select type</option>
                <option value="Paper">Paper</option>
                <option value="Plastic">Plastic</option>
                <option value="Cardboard">Cardboard</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of items"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Photo (Optional)</label>
            <div
              className="photo-upload"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
              {photoPreview ? (
                <div className="photo-preview">
                  <img src={photoPreview} alt="Preview" />
                  <p style={{ marginTop: 8 }}>Click to change photo</p>
                </div>
              ) : (
                <div>
                  <p className="photo-label">Click to upload a photo</p>
                  <p>JPG, PNG up to 2MB</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Materials"}
          </button>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
