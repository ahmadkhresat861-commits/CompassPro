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
src/
  PAGES/        route pages (Home, Courses, Dashboard, Admin, ...)
  components/   shared UI (Navbar, Footer, CourseCover, AuthLayout, ...)
  hooks/        custom hooks
  i18n.js       translations
  redesign.css  design tokens and global overrides
supabase/sql/   SQL scripts already applied to the database (reference only)
public/         static files, sitemap, robots
```

## Database

Row Level Security is enabled on all tables. Admin checks are enforced in the
database (`is_admin()` and policies), not only in the UI. See `supabase/sql/`
for the history of changes.
