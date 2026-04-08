import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import Toast from "../components/Toast";

export default function Feedback() {
  const [usability, setUsability] = useState(0);
  const [helpfulness, setHelpfulness] = useState(0);
  const [suggestions, setSuggestions] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usability || !helpfulness) {
      setToast({ message: "Please rate both usability and helpfulness", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        usability,
        helpfulness,
        suggestions,
        createdAt: serverTimestamp(),
      });

      setUsability(0);
      setHelpfulness(0);
      setSuggestions("");
      setToast({ message: "Thank you for your feedback!", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to submit feedback. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const RatingButtons = ({
    value,
    onChange,
  }: {
    value: number;
    onChange: (val: number) => void;
  }) => (
    <div className="rating-group">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`rating-btn ${value === n ? "selected" : ""}`}
          onClick={() => onChange(n)}
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Feedback</h1>
        <p>Help us improve the Digital Trashcan program by sharing your experience.</p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usability (1 = Poor, 5 = Excellent) *</label>
            <RatingButtons value={usability} onChange={setUsability} />
          </div>

          <div className="form-group">
            <label>Helpfulness (1 = Not Helpful, 5 = Very Helpful) *</label>
            <RatingButtons value={helpfulness} onChange={setHelpfulness} />
          </div>

          <div className="form-group">
            <label htmlFor="suggestions">Suggestions (Optional)</label>
            <textarea
              id="suggestions"
              value={suggestions}
              onChange={(e) => setSuggestions(e.target.value)}
              placeholder="Share your ideas on how we can improve..."
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
