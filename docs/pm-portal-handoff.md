# PM portal redesign handoff

SOQ retains its current cream/navy/gold/white design and existing navigation. PM screenshots informed priorities, not data or permissions. Existing student, trainer, organisation and staff tools remain in their workspaces; `/partner-preview` is a public, non-operational design reference with fictional sample records and figures, excluded from indexing. Nothing there is a signed-in account or a real transaction.

| Audience | First-screen order | Existing source and action | Loading / empty | Access |
| --- | --- | --- | --- | --- |
| Student | Continue enrolled course; booked class; next unpaid instalment; certificates; due tasks; progress | `enrollments`, `session_bookings` + `live_sessions`, `instalments`, `certificates`, `course_tasks`; cards open existing My courses, Payments, Certificates | Skeletons, then no enrolment/class/task copy | Signed-in learner; existing row policies |
| Organisation-linked learner | Same learner view, with organisation name above it | Their own `org_members` row (matched to signed-in email), then matching `profiles` name; actual learner courses and tasks as above | If no verified link/name, ordinary learner heading | Linked student can read only own membership and the linked organisation's name; not the organisation manager's tools |
| Instructor | Seat requests, classes and learner progress; three upcoming sessions; counts | `session_bookings`, `live_sessions`, `trainer_roster()`, `trainer_courses`; open Classes, Students, Courses and Profile | Skeletons; no upcoming class and no requests messaging | Trainer's existing scoped views and functions |
| Organisation/course partner | Team seats, low-progress learners, certificates; enrolment summary | `org_members`, `org_packages`, `org_roster()`; open Team, Progress, Package, Certificates | Skeletons; no linked enrolment messaging | Signed-in organisation account only |
| Staff | Course applications, pending payment checks, SkillsFuture submissions, enquiries, trainer applications | Existing application, payment, claim, ticket and trainer tables; open matching tools | Skeletons; zero queue states | Staff/admin role; existing row policies |
| Admin | Operational queues plus staff access requests | Same sources and `staff_requests`; open Owner → Users & roles | Skeletons; empty queue states | Exact admin role for Owner actions; keep existing owner-only database restrictions |

## Integration contracts still needed

These are separate partner types, **not** extra tabs granted to an organisation account. Do not activate them merely because a design preview exists.

- **Affiliate:** agreed referral URL/token, attributed leads with consent and conversion status, commission agreement and approved payout ledger. Partner sees only their own referrals/settled amounts. Empty state must not imply earnings; referral tool must work and attribution must be auditable before activation.
- **Store seller:** verified seller account, owned products and stock, price/currency, order line items, fulfilment and refund state. Seller sees only their own listings and orders; customer information must be limited to fulfilment needs. Do not present a checkout or order total before commerce is connected.
- **Jobs employer:** verified employer account, owned vacancies, applicant consent, application and interview statuses. Only that employer's authorised recruiters see applicants. The public sample preview shows fictional roles and aggregate stages only, never fictional applicant identities or live vacancies.
- **Specialised staff:** PM brief describes nine staff job types, while this app currently has staff and admin access levels. Agree a permission matrix for each existing tool and each proposed job before introducing role grants, routes, or wider database policies. Cosmetic role selectors are not security.

For each integration, supply actual data ownership rules, backend endpoints/contracts, account linking, exact permissions, error/empty/loading behaviour, and a test account with consent-safe sample data. Preserve the current Owner-only controls, role-specific sign-in destinations, demo labels, and certificate/funding validation rules. WhatsApp, grants and Xero are not live integrations.