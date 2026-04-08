import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Announcement[];
      setAnnouncements(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        <p>Stay updated with the latest news and updates from the Digital Trashcan program.</p>
      </div>

      {announcements.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No announcements yet</h3>
            <p>Check back later for updates and news.</p>
          </div>
        </div>
      ) : (
        announcements.map((a) => (
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
        ))
      )}
    </div>
  );
}
