# Digital Trashcan

A web platform for students, teachers, and staff to manage recyclable materials, request craft materials, view announcements, and give feedback.

## Tech Stack

- **Frontend**: React 19 + Vite (port 5000)
- **Backend/Database**: Firebase Firestore (real-time)
- **Auth**: Firebase Authentication (email/password for admin)
- **Storage**: Firebase Storage (photo uploads)
- **Charts**: Recharts (bar chart, pie chart)
- **Styling**: Pure CSS (no external frameworks)

## Project Structure

```
digital-trashcan/
  src/
    firebase.js              # Firebase init (uses VITE_ env vars)
    App.jsx                  # Main app with hash-based routing
    index.css                # Global styles (green/blue/white theme)
    App.css                  # Shell styles
    components/
      Navbar.jsx             # Responsive navigation bar
      SubmitRecyclables.jsx  # Submit recyclable materials form
      RequestMaterials.jsx   # Request materials form + list
      Announcements.jsx      # Public announcements view
      Feedback.jsx           # User feedback survey
      AdminLogin.jsx         # Firebase email/password login
      AdminDashboard.jsx     # Admin dashboard: stats, charts, management
  vite.config.js             # Host 0.0.0.0:5000, allowedHosts: true
```

## Firebase Collections

| Collection      | Purpose                              |
|----------------|--------------------------------------|
| `recyclables`  | Submitted recyclable material logs   |
| `requests`     | Material requests with status        |
| `announcements`| Admin-posted announcements           |
| `feedback`     | User feedback survey responses       |

## Environment Variables

All stored as Replit env vars (shared):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Features

1. **Submit Recyclables** — Name, Grade/Class, Address, Type, Quantity, photo upload with preview
2. **Request Materials** — Request form (with Address field) + real-time status tracking (Pending / Approved / Fulfilled) + print button
3. **Announcements** — Real-time public board; admin can post/delete with category filter
4. **Feedback** — Rating survey (usability, helpfulness) + suggestions
5. **Admin Dashboard** — Stats cards, bar/pie charts, search filters, CSV exports (both recyclables and requests), inline delete confirmation, photo lightbox, status notes, pending badge on tabs
6. **Admin Auth** — Firebase email/password login
7. **Logo/Favicon** — Custom logo PNG in navbar and browser tab
8. **Professional Footer** — Navigation links + copyright
9. **Live data indicator** — Animated dot in navbar showing real-time updates
10. **Pending badge** — Live count badge on navbar Request link
11. **Back-to-top button** — Floating button appears on scroll
12. **Auto-dismiss alerts** — Success messages auto-clear after 4 seconds
13. **Scroll to top** — Smooth scroll to top on page navigation
14. **Page tab titles** — Browser tab title updates per page
15. **Relative timestamps** — "3 days ago" display in requests list
16. **CSS spinners** — Animated spinners replacing plain loading text
17. **Photo preview** — Thumbnail preview before submitting recyclable photo

## Workflow

- **Start application**: `cd digital-trashcan && npm run dev`
- **Deployment**: Static site — build: `cd digital-trashcan && npm run build`, public dir: `digital-trashcan/dist`

## Admin Setup

To create an admin account:
1. Go to Firebase Console > Authentication > Users > Add user
2. Log in at the app's /admin route with those credentials

## Firebase Security

Firestore rules should be configured in Firebase Console to allow:
- Public read on `announcements`, `recyclables`, `requests`, `feedback`
- Public write on `recyclables`, `requests`, `feedback`
- Authenticated write on `announcements`
