# CompassPro

An educational course platform (LMS-style): courses, lessons with PDFs, live sessions,
progress tracking, certificates with public verification, and an admin dashboard.
Bilingual (English / Arabic with RTL).

**Live:** https://edu-compasspro-two.vercel.app

## Tech stack

- React 19 + Vite
- react-router-dom 7
- Supabase (Auth, Postgres with RLS, Storage, Edge Functions)
- Deployed on Vercel

## Features

- Guest browsing, sign up / login, profile
- Courses, lessons, progress, reviews, certificates (`/verify`)
- Live sessions (Zoom links), notifications, contact form
- Admin panel: courses, lessons, enrollments, users, messages, analytics
- EN/AR UI (`src/i18n.js`), dark mode, SEO (sitemap, robots, meta)

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run lint
```

## Configuration

The Supabase project URL and the **public anon key** are in `src/supabase.js`.
The anon key is safe to expose; data access is protected by Row Level Security.

Never put the `service_role` key or any secret (e.g. API keys for AI features)
in the frontend. Secrets belong in Supabase Edge Function secrets.

## Project structure

```
src/                      FRONTEND (React + Vite)
  pages/                  route pages (Home, Courses, Dashboard, Admin, Instructor, ...)
  components/
    admin/                admin panel pieces (Home editor, analytics)
    instructor/           instructor dashboard tabs (assignments, quizzes, sessions, students)
    course/               what students see inside a course (assignments, quizzes, sessions,
                          cover, certificate)
    home/                 public home page blocks (instructors section, AI assistant)
    layout/               Navbar, Footer, AuthLayout
    guards/               route guards (Protected / Admin / Instructor)
    common/               small shared UI (Avatar, Button, loader)
  context/                LanguageContext (EN/AR + dark mode)
  hooks/                  custom hooks
  utils/                  helpers
  supabase.js             Supabase client (public anon key only)
  i18n.js                 translations
  redesign.css            design tokens and global overrides
public/                   static files, sitemap, robots
backend/                  BACKEND (Supabase)
  sql/                    SQL already applied to the database (reference only), see backend/sql/README.md
```

## Database

Row Level Security is enabled on all tables. Admin checks are enforced in the
database (`is_admin()` and policies), not only in the UI. See `backend/sql/`
for the history of changes.
