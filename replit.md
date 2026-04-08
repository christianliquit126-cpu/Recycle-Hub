# Digital Trashcan

## Overview

A web application for managing recyclable materials in a school environment. Students, teachers, and staff can submit recyclables, request materials for arts & crafts projects, view announcements, and provide feedback.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite (pure CSS, no CSS frameworks)
- **Backend/Database**: Firebase Firestore (real-time NoSQL)
- **Authentication**: Firebase Auth (email/password for admin)
- **Charts**: Recharts (bar charts, pie charts)
- **Routing**: Wouter

## Architecture

The app is frontend-only with Firebase handling all backend operations:
- **Firestore collections**: `submissions`, `requests`, `announcements`, `feedback`
- **Real-time listeners**: All data pages use `onSnapshot` for live updates
- **Admin auth**: Firebase Authentication with email/password sign-in

## Key Files

- `artifacts/digital-trashcan/src/firebase.ts` - Firebase configuration
- `artifacts/digital-trashcan/src/context/AuthContext.tsx` - Auth context provider
- `artifacts/digital-trashcan/src/styles/app.css` - All styling (pure CSS)
- `artifacts/digital-trashcan/src/pages/` - All page components
- `artifacts/digital-trashcan/src/components/` - Shared components (Navbar, Toast)

## Pages

- `/` - Home page with hero, quick links, recent announcements
- `/submit` - Submit recyclable materials form
- `/request` - Request materials for projects, view request status
- `/announcements` - View all announcements
- `/feedback` - Submit feedback with ratings
- `/login` - Admin login
- `/admin` - Admin dashboard with stats, charts, manage requests/announcements/feedback

## Environment Variables (VITE_ prefixed for client access)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Firebase Setup Requirements

1. Create Firestore database in Firebase Console (test mode for development)
2. Enable Email/Password authentication in Firebase Console
3. Create an admin user in Firebase Authentication
