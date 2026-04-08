import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Toast from "../components/Toast";

interface MaterialRequest {
  id: string;
  name: string;
  gradeClass: string;
  materialsNeeded: string;
  quantity: number;
  purpose: string;
  status: "Pending" | "Approved" | "Fulfilled";
  createdAt: Date;
}

export default function RequestMaterials() {
  const [name, setName] = useState("");
  const [gradeClass, setGradeClass] = useState("");
  const [materialsNeeded, setMaterialsNeeded] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as MaterialRequest[];
      setRequests(items);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !gradeClass || !materialsNeeded || !quantity || !purpose) {
      setToast({ message: "Please fill in all fields", type: "error" });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "requests"), {
        name,
        gradeClass,
        materialsNeeded,
        quantity: parseInt(quantity, 10),
        purpose,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      setName("");
      setGradeClass("");
      setMaterialsNeeded("");
      setQuantity("");
      setPurpose("");
      setToast({ message: "Request submitted successfully!", type: "success" });
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to submit request. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Request Materials</h1>
        <p>Need recycled materials for your arts and crafts project? Submit a request below.</p>
      </div>

      <div className="card" style={{ maxWidth: 640, marginBottom: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="req-name">Name *</label>
              <input
                id="req-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="req-grade">Grade / Class *</label>
              <input
                id="req-grade"
                type="text"
                value={gradeClass}
                onChange={(e) => setGradeClass(e.target.value)}
                placeholder="e.g. Grade 10 - Section A"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="materials">Materials Needed *</label>
              <input
                id="materials"
                type="text"
                value={materialsNeeded}
                onChange={(e) => setMaterialsNeeded(e.target.value)}
                placeholder="e.g. Cardboard boxes, plastic bottles"
              />
            </div>
            <div className="form-group">
              <label htmlFor="req-qty">Quantity *</label>
              <input
                id="req-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of items"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose / Project Description *</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe your project and how you will use the materials"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Your Requests</h2>
        </div>
        {requests.length === 0 ? (
          <div className="empty-state">
            <h3>No requests yet</h3>
            <p>Submit a request above to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Materials</th>
                  <th>Quantity</th>
                  <th>Purpose</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.name}</td>
                    <td>{req.materialsNeeded}</td>
                    <td>{req.quantity}</td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {req.purpose}
                    </td>
                    <td>
                      <span className={`badge badge-${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </td>
                    <td>{req.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
