# Backend SQL

These scripts were applied manually to the live Supabase database (SQL Editor).
They are kept here as documentation/history only. This folder is intentionally NOT
`supabase/migrations/`: the Supabase CLI would treat files there as pending migrations
and try to re-apply them. Always review a script before running it again.

| Folder | What it holds |
|---|---|
| `instructor/` | Instructor system, in order: `instructor_role` (role + course assignment), `phase1` (chapters, public profile card), `phase2` (assignments + submissions), `phase3` (quizzes, timer, anti-cheat), `phase4` (live sessions per course), `phase5` (certificate approval), `phase6` (admin-approved public instructors), `phase7_admin_lockout` (lessons and course sessions writable by the course instructor only; admin keeps general sessions) |
| `security/` | RLS hardening and fixes (`hardening`, `security_fixes`, `security_stage2`, `protect_profile_type`) |
| `features/` | Platform features: certificates + verification, home page settings, notifications, messages, public courses, student counts, admin analytics |
| `performance/` | Indexes |

Edge Functions (`zephyr-ai`, `quick-action`) live on Supabase only and are not stored in this repo.
