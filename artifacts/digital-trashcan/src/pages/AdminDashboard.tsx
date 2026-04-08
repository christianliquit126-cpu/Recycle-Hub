import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Submission {
  id: string;
  name: string;
  gradeClass: string;
  type: string;
  quantity: number;
  photo: string | null;
  createdAt: Date;
}

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

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface FeedbackItem {
  id: string;
  usability: number;
  helpfulness: number;
  suggestions: string;
  createdAt: Date;
}

const PIE_COLORS = ["#2e7d32", "#42a5f5", "#f9a825", "#9c27b0"];

export default function AdminDashboard() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/login");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    const unsubSubmissions = onSnapshot(
      query(collection(db, "submissions"), orderBy("createdAt", "desc")),
      (snap) => {
        setSubmissions(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as Submission[]
        );
      }
    );

    const unsubRequests = onSnapshot(
      query(collection(db, "requests"), orderBy("createdAt", "desc")),
      (snap) => {
        setRequests(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as MaterialRequest[]
        );
      }
    );

    const unsubAnnouncements = onSnapshot(
      query(collection(db, "announcements"), orderBy("createdAt", "desc")),
      (snap) => {
        setAnnouncements(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as Announcement[]
        );
      }
    );

    const unsubFeedback = onSnapshot(
      query(collection(db, "feedback"), orderBy("createdAt", "desc")),
      (snap) => {
        setFeedbackList(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
          })) as FeedbackItem[]
        );
      }
    );

    return () => {
      unsubSubmissions();
      unsubRequests();
      unsubAnnouncements();
      unsubFeedback();
    };
  }, []);

  const totalRecyclables = submissions.reduce((sum, s) => sum + s.quantity, 0);
  const uniqueContributors = new Set(submissions.map((s) => s.name)).size;
  const pendingRequests = requests.filter((r) => r.status === "Pending").length;

  const typeData = submissions.reduce(
    (acc, s) => {
      const existing = acc.find((x) => x.name === s.type);
      if (existing) existing.value += s.quantity;
      else acc.push({ name: s.type, value: s.quantity });
      return acc;
    },
    [] as { name: string; value: number }[]
  );

  const barData = (() => {
    const grouped: Record<string, number> = {};
    submissions.forEach((s) => {
      const month = s.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      grouped[month] = (grouped[month] || 0) + s.quantity;
    });
    return Object.entries(grouped)
      .map(([month, total]) => ({ month, total }))
      .slice(-6);
  })();

  const updateRequestStatus = async (id: string, status: "Approved" | "Fulfilled") => {
    try {
      await updateDoc(doc(db, "requests", id), { status });
      setToast({ message: `Request ${status.toLowerCase()} successfully`, type: "success" });
    } catch {
      setToast({ message: "Failed to update request", type: "error" });
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      setToast({ message: "Please fill in both title and content", type: "error" });
      return;
    }
    try {
      await addDoc(collection(db, "announcements"), {
        title: annTitle,
        content: annContent,
        createdAt: serverTimestamp(),
      });
      setAnnTitle("");
      setAnnContent("");
      setToast({ message: "Announcement posted!", type: "success" });
    } catch {
      setToast({ message: "Failed to post announcement", type: "error" });
    }
  };

  const deleteAnnouncement = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      setToast({ message: "Announcement deleted", type: "success" });
    } catch {
      setToast({ message: "Failed to delete announcement", type: "error" });
    }
  };

  if (authLoading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "submissions", label: "Submissions" },
    { id: "requests", label: "Requests" },
    { id: "announcements", label: "Announcements" },
    { id: "feedback", label: "Feedback" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Manage submissions, requests, announcements, and view analytics.</p>
      </div>

      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-card-label">Total Recyclables</div>
              <div className="stat-card-value">{totalRecyclables}</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-card-label">Active Contributors</div>
              <div className="stat-card-value">{uniqueContributors}</div>
            </div>
            <div className="stat-card yellow">
              <div className="stat-card-label">Pending Requests</div>
              <div className="stat-card-value">{pendingRequests}</div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Recyclables by Type</h3>
              {typeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {typeData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>No data yet</p>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h3>Monthly Collections</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2e0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#2e7d32" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <p>No data yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === "submissions" && (
        <div className="card">
          <div className="card-header">
            <h2>All Submissions ({submissions.length})</h2>
          </div>
          {submissions.length === 0 ? (
            <div className="empty-state">
              <h3>No submissions yet</h3>
              <p>Submissions will appear here in real time.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Grade/Class</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Photo</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.gradeClass}</td>
                      <td>{s.type}</td>
                      <td>{s.quantity}</td>
                      <td>
                        {s.photo ? (
                          <img
                            src={s.photo}
                            alt="Submission"
                            style={{
                              width: 48,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 6,
                            }}
                          />
                        ) : (
                          <span style={{ color: "var(--gray-300)" }}>--</span>
                        )}
                      </td>
                      <td>{s.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="card">
          <div className="card-header">
            <h2>Material Requests ({requests.length})</h2>
          </div>
          {requests.length === 0 ? (
            <div className="empty-state">
              <h3>No requests yet</h3>
              <p>Requests will appear here in real time.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Materials</th>
                    <th>Qty</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.materialsNeeded}</td>
                      <td>{r.quantity}</td>
                      <td
                        style={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {r.purpose}
                      </td>
                      <td>
                        <span className={`badge badge-${r.status.toLowerCase()}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {r.status === "Pending" && (
                            <button
                              className="btn btn-small btn-approve"
                              onClick={() => updateRequestStatus(r.id, "Approved")}
                            >
                              Approve
                            </button>
                          )}
                          {(r.status === "Pending" || r.status === "Approved") && (
                            <button
                              className="btn btn-small btn-fulfill"
                              onClick={() => updateRequestStatus(r.id, "Fulfilled")}
                            >
                              Fulfill
                            </button>
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

      {activeTab === "announcements" && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <h2>Post New Announcement</h2>
            </div>
            <form onSubmit={postAnnouncement}>
              <div className="form-group">
                <label htmlFor="ann-title">Title</label>
                <input
                  id="ann-title"
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Announcement title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ann-content">Content</label>
                <textarea
                  id="ann-content"
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Write your announcement..."
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Post Announcement
              </button>
            </form>
          </div>

          <div className="card">
            <div className="card-header">
              <h2>Existing Announcements ({announcements.length})</h2>
            </div>
            {announcements.length === 0 ? (
              <div className="empty-state">
                <h3>No announcements</h3>
                <p>Post your first announcement above.</p>
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className="announcement-card"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
                >
                  <div>
                    <h3>{a.title}</h3>
                    <p>{a.content}</p>
                    <div className="announcement-date">
                      {a.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => deleteAnnouncement(a.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "feedback" && (
        <div className="card">
          <div className="card-header">
            <h2>Feedback Responses ({feedbackList.length})</h2>
          </div>
          {feedbackList.length === 0 ? (
            <div className="empty-state">
              <h3>No feedback yet</h3>
              <p>Feedback submissions will appear here.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Usability</th>
                    <th>Helpfulness</th>
                    <th>Suggestions</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackList.map((f) => (
                    <tr key={f.id}>
                      <td>{f.usability} / 5</td>
                      <td>{f.helpfulness} / 5</td>
                      <td
                        style={{
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.suggestions || "--"}
                      </td>
                      <td>{f.createdAt.toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
