# Demo accounts, 1-click login, /admin and maintenance mode

## What you'll get
1. **Five demo accounts**, one for each role:
   - Admin (full access) goes to the Staff admin page
   - Staff goes to the Staff admin page
   - Instructor (trainer) goes to the Trainer Dashboard
   - Student goes to the Student Portal
   - Organization (a company that sponsors its staff) goes to the Student Portal and sees the courses its employees are taking
2. **"Demo login (1 click)" buttons** on the Log in page, one per role. Short links like `/demo-login/student` also work.
3. **A demo on/off switch** in Staff admin → Settings. When it's off, the buttons disappear and the demo links stop working. It starts **on** so you can explore the site, and it must be switched **off** before launch.
4. **/admin shortcut**: opening `soq.edu.sg/admin` takes you to the Log in page, then to the Staff admin page. Staff can change this path in Settings (lowercase letters and numbers only).
5. **Maintenance mode** in Settings: a title, a message and an optional "back by" date. While it's on, visitors see a maintenance page. Staff who are signed in, or who open the site with a secret access key, can still use the site normally.

## Things that will differ from the guide
- **Passwords:** the site needs passwords of at least 6 characters, so "admin" and "staff" won't work. The demo passwords will be `admin123`, `staff123`, `instructor123`, `student123` and `organization123`.
- **Staff vs Admin:** today the site only has one staff level. Staff accounts will be able to open the Staff admin page, but only Admin can change roles, settings, maintenance mode and the demo switch. A full permission grid for each role is not included here.
- **Organization:** this is a new account type with a basic view of its sponsored employees. The full company tools (seats, bulk payment) are not included.

## Security notes
- The demo accounts and 1-click buttons are for exploring only. Leaving them on a live site would let anyone sign in as staff.
- The 1-click sign-in runs on the server, so demo passwords are never hidden in the web page itself.

## Technical details
- Migration: add `staff` and `organization` to the `app_role` enum. Add `site_settings` keys `demo_login` (boolean), `admin_path` (text) and `maintenance` (`{enabled, title, message, ends_on, access_key}`). Add an `org_members` table (org_id, member_email) with RLS: the organization reads its own rows, admin manages all. Add grants.
- Server function `demoLogin(role)`: reads `demo_login` from `site_settings` and refuses when it's off. It creates or refreshes the account with `supabaseAdmin` (setting the password and roles), signs in with the password on the server and returns the session. The browser then calls `setSession`. A route `/demo-login/$role` calls it and redirects to the matching page.
- Routes `/admin` and `/$adminPath`: redirect to `/login?next=/portal-admin` (a catch-all check against the `admin_path` setting).
- Maintenance: a check in `__root` on the client. It reads the `maintenance` setting (readable by anyone) and shows a MaintenancePage unless the visitor is admin/staff or the URL has `?key=` matching the access key (stored in localStorage). Pages under `/maintenance` and `/login` are never blocked.
- `portal-admin` accepts `staff` as well as `admin`. Settings, roles, demo and maintenance controls stay admin-only in both the page and RLS.
