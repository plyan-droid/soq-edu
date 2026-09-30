# Add course creation + complete SkillsFuture settlement for staff/admin

## What already works
- Edit any existing course (title, fee, duration, mode, badge, outcomes, syllabus) and manage intake dates.
- SkillsFuture claims tool: staff log a claim (learner, course, fee, SFC amount) and move it Submitted → Approved → Paid out / Rejected.
- Exemptions (fee reductions) with approve/reject.

## What is missing
1. **No "Add course"** — new courses only arrive via trainer proposals.
2. **SkillsFuture is not fully settleable:**
   - Learners' self-reported SFC balances cannot be marked verified by staff.
   - A claim is not linked to the learner's payment, so an approved/paid claim does not reduce what the learner still owes.
   - No claim reference / note / date settled is captured when marking "Paid out".
   - Learners' claim requests (from the SkillsFuture page) don't appear as a queue on staff Home.
3. **Courses: no archive/hide** for a course staff no longer run, and no delete for staff-created courses.

## What to build
- **Add course** button in Course Editor: title, category, summary, fee, duration, mode, outcomes, syllabus sections, optional first intake date. Appears on the catalogue, course page, calendar, Find My Course and Compare like built-in courses. Staff-created courses can be edited, hidden or deleted; built-in courses can be hidden (not deleted).
- **SkillsFuture settlement** (Money → SkillsFuture):
  - Balance list with "Verify balance" (records who verified and when); learners see "Verified by SOQ" instead of "Self-reported".
  - Claim form links to the learner's payment; approving/paying out shows the remaining amount the learner pays after SFC.
  - "Mark paid out" asks for the SkillsFuture claim reference and settlement date.
  - Filters: Submitted / Approved / Paid out / Rejected, plus totals per status.
  - Staff Home queue row "Settle SkillsFuture claims" with count (pinned like payments).
- Same access for admin and staff; SkillsFuture gov connection stays a placeholder (manual settlement only).

## Technical details
- New table `custom_courses` (slug, title, category, summary, price, duration, mode, outcomes, sections jsonb, hidden, created_by) with grants + RLS: public read of non-hidden, staff/admin write. Add `hidden` to `course_overrides`. Merge into the course catalogue loader.
- `sfc_balances`: add `verified_at`, `verified_by`. `sfc_claims`: add `payment_id`, `settled_on`, `staff_note`; staff/admin update policy.
- Update `staff-phase4.tsx` SFC tool, Course Editor in `staff-courses.tsx`, `skillsfuture.tsx` learner view, and the staff Home queue in `start-here.tsx`.
- Verify with Playwright as staff and admin.
