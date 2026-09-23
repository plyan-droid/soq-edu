# Plan: verified badges, staff admin, student dashboard, external system links

## 1. Verified badge in the SOQ Community (can build now)
- Add a "verified" flag to community profiles that only staff can switch on or off. Members can't set it on themselves.
- Show a gold "Verified SOQ" check next to the name on posts, comments, profiles and the member list.
- Trainer and Business labels show as "unverified" (muted) until staff verify them.
- Staff admin page gets a "Community members" tab: search members, see their label, verify or un-verify them.

## 2. Staff admin account and full walkthrough (needs your email)
- I need the SOQ staff email you want as the admin. I'll create that account, or promote it if it already exists, and send a password-set link to that address.
- Then I'll test it for real: submit an application on a course page, open Staff admin as that admin, mark it "contacted", check the status stays after a reload, and delete the test entry.

## 3. Student dashboard on this site (can build now)
The current portal page already shows enrolled courses, progress, deadlines and assessments. I'll add:
- **My applications**: every application the student sent from a course page, with its status (new / contacted / enrolled / closed) and date. Applications are linked by the student's login email, so ones sent before they signed up also appear.
- A clearer layout: summary tiles (applications, active courses, next deadline), then the sections below.
- Everything stays on this site. Nothing redirects to the existing portal.

## 4. Log in with the existing SOQ portal account (blocked)
The existing portal (soq.trainingsystemsg.com) is run by a separate company. I can only let students use those logins, or read their data, if that company gives SOQ one of these:
- a sign-in link-up (SSO, OAuth or SAML), or
- a data connection (API access with a key).
I checked the portal's public site and found no public connection option. Until SOQ gets these details, students keep a separate login on this site. Once you have them, I'll connect it.

## 5. Send applications to SOQ's own system (blocked)
Same limit: I need to know where SOQ records applications (for example the portal above, a CRM, or a shared spreadsheet) and how to send data to it (API key, form address or webhook). Once you tell me, every application will be saved here **and** sent there, with a retry if sending fails. Until then, applications are saved here and I can also email each one to academy@soq.edu.sg as a backup. Tell me if you'd like the email copy.

## Technical details
- Migration: `community_profiles.verified boolean default false`, `verified_at`, `verified_by`. A trigger stops non-admins from changing these fields. Admin-only update runs through `has_role(auth.uid(),'admin')`.
- Applications: add a SELECT policy for authenticated users where `lower(email) = lower(auth.jwt()->>'email')`. Read-only for students.
- Admin setup: create or promote the user through the admin auth API, then insert `user_roles(role='admin')`.
- Items 4 and 5 are designed as later add-ons: a server function that calls the outside system with its key stored as a secret.
