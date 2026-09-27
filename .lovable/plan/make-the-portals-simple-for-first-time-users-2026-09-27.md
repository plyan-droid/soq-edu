# Make the portals simple for first-time users

## Where things stand after the last change

| Problem | Status |
|---|---|
| 1. Too many menu items, first page should be 3–4 big action cards | Partly fixed. Start here exists, but it has 6 general cards like "Live classes", not actions like "Confirm seat requests". The menus are just as long as before. |
| 2. No getting-started guidance | Partly fixed. The trainer checklist has no "create a course" step, and "Fill in your listing" goes to the 1-to-1 page instead of where the listing actually is. |
| 3. Duplication (Live classes vs Calendar, tutor listing hidden in Tutor Finder) | Not fixed. |
| 4. "Loading…" waiting states | Partly fixed. The portal frame and the staff lists have loading placeholders. Live classes, lessons, course pages, community and tutors still show "Loading…". |
| 5. Long menus on phones, bottom bar wanted | Partly fixed. Swipeable buttons replaced the drop-down menus, but there's no bottom bar. |

## Plan

### 1. Shorter menus with one home for each task
Trainer menu goes from 13 items to 5:
- **Home**: action cards, checklist and a few key numbers. The old Overview and Stats move in here.
- **Classes**: live classes and 1-to-1 sessions, each shown in a list or calendar view. This replaces Calendar, Live classes, 1-to-1 slots and Lesson history.
- **Courses**: lessons, quizzes, assignments and course proposals.
- **Students**: roster, attendance and notices.
- **Profile**: the public tutor listing, moved here from Tutor Finder, which will link to it.

Student menu: Home, My courses, Certificates, Payments & funding. Instalments and SkillsFuture will be two tabs on one page.

Business menu: Home, Team, Progress & certificates, Package.

Staff menu: Home, Learners, Courses, Money, Messages, Settings. It keeps the same groups as today, but inside each group the tools appear as tabs across the top of the page rather than a long side list. Rarely used tools (Login history, AI writer, Gov & Xero links) move under Settings.

### 2. Home page: 3–4 action cards, each with a live count
- **Trainer:** "Confirm seat requests (2)", "Add a class", "Check students (3 behind)", "Add a lesson".
- **Student:** "Continue [course name] (40%)", "Join next class on [date]", "Pay instalment due [date]", "Get your certificate".
- **Business:** "Add employees (3 seats left)", "See who's behind", "Download team certificates".
- **Staff:** "Approve applications (n)", "Confirm payments (n)", "Check SkillsFuture claims (n)", "Post a notice".

A card with a count of zero moves to the back, so the most urgent task always comes first. Tapping a card opens the exact page, with the form already open where it makes sense, for example "Add a class" opens the new-class form.

### 3. Getting-started checklist and empty-page hints
- **Trainer steps:** add your listing, create or propose a course, add your first lesson, schedule a class, offer a 1-to-1 slot.
- **Student steps:** complete your profile, open your first lesson, add your SkillsFuture balance.
- **Business steps:** check your package, add your first employee, assign a course.
- The checklist hides itself once every step is done. It can also be dismissed and brought back from Home.
- Every empty page shows a one-line hint and a button, for example "No classes yet. Add your first class", instead of a blank list.

### 4. Loading placeholders everywhere
Every remaining "Loading…" becomes a grey outline of the page, covering portal pages, course lessons, live classes, community, the tutor list and profile, the noticeboard and bundles.

### 5. Bottom bar on phones
- Phones get a fixed bottom bar with the 4–5 main menu items, each with an icon and a short label.
- The Staff "More" button opens a sheet listing the remaining groups.
- Tabs inside a page still swipe sideways.
- The bottom bar sits above the WhatsApp button and the assistant button, which move up so nothing overlaps.

### 6. Check it
I'll walk each role on a computer and on a phone-sized screen and confirm three things: tapping a Home card opens the right page, refresh keeps you on the same page, and nothing overlaps the bottom bar.

## Technical details
- Extend `WorkspaceShell` with an `icon` per section and optional in-page `tabs` per item, plus a mobile `BottomNav`. Staff admin will switch to the same shell, so there's one navigation system.
- Old `?tool=` addresses will map to the new pages, so existing bookmarks still work.
- `StartHere` will take cards with a `count` query and a `tool` plus an optional `action` parameter, for example `?tool=classes&new=1`. Checklist dismissal will be saved per user in the browser.
- The tutor listing form will be pulled out of `tutor-finder.tsx` into its own component, used by the trainer's Profile page.
- Shared `EmptyState` and `ListSkeleton` components will replace the inline messages.
- Nothing changes in the data or the login rules. This is presentation only.
