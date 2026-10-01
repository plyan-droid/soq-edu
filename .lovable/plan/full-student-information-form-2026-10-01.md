# Full student information form

## The gap today

A student's record only holds their **name and email**. Phone, citizenship and other details are re-typed on every course application, and neither the student nor staff can view or update them afterwards.

## What we'll build

**1. A real student profile (database)**
- Add fields to each student's record: phone, date of birth, citizenship, address, postal code, emergency contact (name + phone), and how they heard about SOQ.
- Only the student themselves and staff/admin can see or change these fields (enforced by the database, not just hidden buttons).

**2. Student portal — "My details" form**
- New tab in the student dashboard with a full form: personal details, contact details, address, emergency contact.
- Saves to their record; shown pre-filled next time.

**3. Staff/admin — student detail view**
- In Learners → Students, clicking a student opens their full details form.
- Staff/admin can view and correct any field (e.g. fixing a phone number over the phone).

**4. Applications pre-fill**
- The course application form pre-fills name, email, phone and citizenship from the student's saved profile when they're signed in — no re-typing.

## Technical details

- Migration: new columns on `profiles` (phone, date_of_birth, citizenship, address, postal_code, emergency_name, emergency_phone, referral_source) with updated RLS policies (owner read/write own row; staff/admin read/write via existing role check). GRANTs already exist on `profiles`.
- `src/components/student-profile-form.tsx` — shared zod-validated form used by both the student tab and the staff student-detail view.
- `src/routes/student-portal.tsx` — new "My details" tab under Home section.
- `src/components/staff-tools.tsx` (Students tool) — row click opens the detail form.
- `src/components/course-apply-form.tsx` — pre-fill from profile when signed in.
- British English copy; verify with a Playwright walkthrough (student fills form → staff sees the same details).
