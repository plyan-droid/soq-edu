<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Staff Admin navigation groups existing tool IDs in one section definition on the portal page; this keeps desktop and mobile navigation synchronized without changing tool workflows.
- The Staff workspace has an "Owner" section (Users & roles, Site pages, Gov & Xero, Settings) visible only to true admins; the database enforces the same split (`is_top_admin` on user_roles/site_settings writes and now on site_pages/staff_requests writes), so staff who guess a URL still cannot use owner tools.
- Role dashboards use WorkspaceShell for consistent navigation; trainer data is role-scoped, never invented earnings or visitors. Staff Today prioritises real queues and activity; Reports holds detailed figures.
- The portal assistant uses a signed-in server route with read-only, account-scoped data tools and keeps separate conversations only in page memory; this prevents cross-user disclosures and clears chats on refresh.
- Certificate preview and PDF share one design record and the official SOQ logo asset; this keeps issued downloads consistent with staff-selected templates.
- Demo portal records are linked only to demo accounts and visibly marked DEMO; never seed genuine certificate validation or confirmed funding because those imply verified achievements or entitlements.
- Role portals use WorkspaceShell: 4–6 main areas, visible tool tabs, urgent-first Home cards and a dismissible checklist; keeps tasks obvious on desktop and phones.
- Trainer workspace keeps task-first Home and trainer-scoped typography/colour overrides while preserving tool IDs; this simplifies teaching workflows without changing other portals or shared links.
- Staff Messages shows live Contact tickets alongside explicitly DEMO-only WhatsApp conversations; private WhatsApp tables remain empty until a verified Business connection and receiver exist, preventing mock chats from being mistaken for customer messages.
- Partner previews are detailed read-only samples; signed-in organisations use account-linked learning records, while sample commerce, referral and hiring figures never imply real transactions.
- Student Home reads learner-scoped activity and only an email-linked organisation name, never manager tools; this keeps dashboard details private.
- Applicant accounts (staff-added or website) are created only in server functions with the admin client; website submissions never change an existing account's details.
- Trainer Courses → Classroom groups each course into Stream, Classwork, People and Grades views reusing existing tables; keeps per-course teaching in one place.
- Course-specific Community discussions use separate private threads and replies scoped by course membership, keeping public community posts distinct from classroom conversations.
- Student class links open a course-specific Community-style post feed within Stream, with at most one trainer-pinned announcement above it; Classwork and Grades remain alongside, /learn/$slug shares the workspace for assessment deep links, and People remains trainer-only, so classes feel like the wider Community without exposing private posts.
- The official SOQ logo is bundled locally for shared chrome, chat and certificate PDF; this avoids intermittent CDN asset-proxy failures that broke the visible brand and PDF downloads.
- Student invoice PDFs derive from account-scoped transfer or order records and label unconfirmed transfers and demo orders explicitly; a generated document never claims payment is verified.
- Student Classroom examples live only in the presentation for identified demo learners; they must never become real submissions, grades or certificates.
- Assignment mark drafts are instructor-only records separate from submitted work; learner-visible marks and feedback appear only when work is explicitly returned.
