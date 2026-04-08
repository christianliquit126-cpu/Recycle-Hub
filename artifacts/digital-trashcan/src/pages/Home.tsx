import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function Home() {
  const [, navigate] = useLocation();
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Announcement[];
      setRecentAnnouncements(items);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="hero">
        <h1>Digital Trashcan</h1>
        <p>
          A community platform for recycling and reusing materials. Submit your
          recyclables, request materials for art projects, and help build a
          greener school environment.
        </p>
        <div className="hero-actions">
          <button className="btn btn-white" onClick={() => navigate("/submit")}>
            Submit Materials
          </button>
          <button
            className="btn btn-outline-white"
            onClick={() => navigate("/request")}
          >
            Request Materials
          </button>
        </div>
      </div>

      <div className="quick-links">
        <div className="quick-link-card" onClick={() => navigate("/submit")}>
          <div className="quick-link-icon green">R</div>
          <h3>Recycle</h3>
          <p>
            Submit recyclable materials like paper, plastic, and cardboard for
            collection and reuse.
          </p>
        </div>
        <div className="quick-link-card" onClick={() => navigate("/request")}>
          <div className="quick-link-icon blue">A</div>
          <h3>Arts & Crafts</h3>
          <p>
            Request recycled materials for your creative projects and school
            activities.
          </p>
        </div>
        <div className="quick-link-card" onClick={() => navigate("/feedback")}>
          <div className="quick-link-icon yellow">F</div>
          <h3>Feedback</h3>
          <p>
            Share your experience and suggestions to help us improve the
            program.
          </p>
        </div>
      </div>

      {recentAnnouncements.length > 0 && (
        <div>
          <div className="card-header">
            <h2>Recent Announcements</h2>
            <button
              className="btn btn-small btn-outline"
              onClick={() => navigate("/announcements")}
            >
              View All
            </button>
          </div>
          {recentAnnouncements.map((a) => (
            <div key={a.id} className="announcement-card">
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
          ))}
        </div>
      )}
    </div>
  );
}
