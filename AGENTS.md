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
- Staff Messages shows live Contact tickets alongside explicitly DEMO-only WhatsApp conversations; private WhatsApp tables remain empty until a verified Business connection and receiver exist, preventing mock chats from being mistaken for customer messages.
- Partner previews are detailed read-only samples; signed-in organisations use account-linked learning records, while sample commerce, referral and hiring figures never imply real transactions.
- Student Home reads learner-scoped activity and only an email-linked organisation name, never manager tools; this keeps dashboard details private.
