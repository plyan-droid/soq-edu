# Staff workspace: owner/staff split + four new oversight tools

## Goal

Give admin (owner) and staff genuinely different views, and add the oversight tools the workspace currently lacks.

**Verified current state:** the database treats staff and admin as equal for all day-to-day data; only role changes and site settings writes are already restricted to true admins (`is_top_admin`). The workspace shows both roles an identical menu — the difference is invisible.

## 1. Owner vs staff split

- Staff see: Home, Learners, Courses, Money, Messages — day-to-day tools.
- Admin additionally sees a new **Owner** group:
  - Users & roles (existing) — approving staff-access requests also moves here.
  - Owner settings (existing SettingsHub: site settings, demo login switch).
  - Site pages (existing PagesEditor).
  - Gov & Xero links (existing IntegrationsStatus) — owner-level integrations.
- Staff keep message templates, forms, AI writer and login history in Messages/Settings where useful.

Wait — the current groups merge everything under Settings. The build keeps all existing tools working; only their placement and visibility change. No tool is deleted.

Enforcement, not just hiding:
- `user_roles` grants/removals and `site_settings` writes are already admin-only in the database (verified). No change needed there.
- Tighten the few owner-only tables so hiding matches the database: site pages writes and staff-request approvals become admin-only (`is_top_admin`), matching their new owner-only placement.
- The workspace nav filters the Owner group by the signed-in role; a staff member who knows a URL still sees the "Staff only" page for owner tools (the route already does this and gains a per-tool owner check).

## 2. Four new oversight tools (my suggestion — all four, one per group)

**Live classes & 1-to-1** (new tab in Courses):
- All live classes across courses with seat requests; staff can confirm or decline a pending request.
- 1-to-1 tutor slots and their bookings at a glance.
- Tutor profile controls: show/hide on the public tutor finder, and mark verified.

**Community moderation** (new tab in Messages):
- All community posts and comments with hide/unhide.
- Grant or remove the verified member badge.

**Organisations & events** (new tabs: Organisations in Learners, Events in Courses):
- Business packages: create/edit packages, seats, expiry; view each organisation's roster (roster tool already exists, now reachable with package context).
- Site events: create/edit events, view sign-up lists.

**Learning oversight** (new tab in Learners):
- Assignments and submissions across all courses — view, score and give feedback (today only trainers can).
- Quizzes with pass marks and attempts; attendance summary per live session.

## 3. Placement in the menu

```text
Home     Today · Reports
Learners Students · Applications · Admissions · Enrol · Waitlists · Exemptions
         Certificates · Organisations · Learning oversight
Courses  Intakes · Trainer applications · Trainer courses · Reviews · Bundles
         Certificate design · Live classes & 1-to-1 · Events
Messages Inbox · Community · Community moderation · Newsletter · Noticeboard
         WhatsApp reminders · Leads
Owner    Users & roles · Site pages · Gov & Xero · Settings   (admins only)
```

## 4. Technical notes

- New read/write paths use the browser client with existing RLS; where a new admin action is needed (e.g. moderating any post, editing any event) the existing `has_role` policies already allow staff/admin — verify per table during build and add narrow policies where missing.
- New components follow the existing staff-tools pattern (`staff-tools.tsx`, `staff-phase*.tsx`); each new tab is a small component wired into `portal-admin.tsx`.
- Sample rows shown in new tools are real demo data already in the database, marked DEMO where they imply verified achievements or entitlements.
- British English throughout.

## Out of scope (unchanged)

- No WhatsApp connection, Xero or grant checker changes.
- Trainer/student/business portals untouched.
- No change to who can issue certificates.
