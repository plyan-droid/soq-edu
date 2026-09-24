# Client guide gap check: what's built vs what's missing

The client guide lists 30 core features, a 59-item Modules Bundle and 9 Singapore packs. The licence-code screens ("Feature not activated") come from their old off-the-shelf system. On our site every feature we build is simply switched on, so we skip licence codes.

## Already built (no work needed)
Course catalogue and filters, course pages, lesson pages with video, cart and checkout (pretend payment), certificate check, become-a-trainer form, trainer course drafts and approval, live classes (Zoom, Whereby, Meet, Teams), trainer dashboard, course reviews, users and roles, Verified badge, message templates, support inbox, reports, page editor, discount codes, newsletter, sales, colours and timezone settings, Google sign-in, community forum and livestreams, SkillsFuture fee box, job matching page.

## Missing: to build, in 4 phases

### Phase 1: Students
- **Course Q&A**: questions and answers on each course page between students and the trainer
- **Course notes**: private notes on each lesson
- **Course chatroom**: live chat for students enrolled in the same course
- **Tutor finder**: a short quiz that matches you to trainers by subject and available time
- **Gift a course**: buy a course for someone else and choose the send date

### Phase 2: Trainers
- **Quizzes and certificates**: quizzes with auto-marking, a question bank, and a certificate when you pass (connects to the certificate check)
- **Assignments**: homework with deadlines, file upload, grades and feedback
- **Attendance**: mark present, absent or late for each live class
- **Drip content**: lessons unlock by date or in order
- **Course notices**: coloured notices inside a course
- **Course stats**: charts of enrolments, progress and quiz scores
- **Meeting booking**: trainers set free time slots; students book 1-to-1 sessions
- **Upcoming courses and events**: "notify me" for new courses; event sign-ups

### Phase 3: Staff and admin
- **Enrol students by hand** and **bulk import from CSV** (students, courses)
- **Bank transfer (PayNow) payments**: students upload proof, staff approve
- **Instalment plans** with due dates and reminders
- **Waitlist** when an intake is full
- **Site-wide noticeboard** for students, trainers or everyone
- **Course bundles** (several courses at one price)
- **Form builder** for surveys
- **Certificate designer** with QR code and signature
- **Login history** and sign out all devices
- **AI writer** for course descriptions and blog drafts
- Referral links, reward points and cashback: **one simple referral scheme** only (see questions)

### Phase 4: Singapore pack
- **Diploma admissions pipeline**: application, screening, offer, accept (for PEI diplomas)
- **Module exemptions**: RPL and credit-transfer requests that lower the fee automatically
- **SkillsFuture Credit tracking**: record the credit used per enrolment and match it to the fee
- **WhatsApp reminders**: ready-made WhatsApp messages for classes and payments (staff click to send)
- **CRM leads import** from a Privyr export or CSV
- Needs outside accounts, so we only add placeholders for now: **TPGateway/SSG**, **grant checks with government systems**, **Singpass/Corppass**, **Xero**. Each needs SOQ's government or company access first.

## Left out on purpose
Licence codes, SaaS packages, multi-currency (site uses SGD), SMS login, BigBlueButton, Jitsi, SCORM, built-in whiteboard or video calls, watermarking and protected video hosting, store/marketplace, abandoned-cart emails, sales pop-ups. These need outside services or don't fit a single academy. Any of them can be added later on request.

## Technical details
- New tables (all with row-level access rules): course_questions/answers, lesson_notes, course_chat_messages (realtime), gifts, quizzes/quiz_questions/quiz_attempts, assignments/submissions, attendance, course_notices, meeting_slots/bookings, events/event_signups, course_follows, offline_payments, installments, waitlist, notices, bundles, forms/form_responses, certificate_templates, referrals, admissions, exemptions, sfc_claims, leads.
- File uploads use storage buckets (assignments, payment proofs, note attachments).
- Certificates reuse /verify-certificate; the AI writer uses the existing AI setup.
- Singapore placeholders are staff status pages only, with no real outside connections.
- Each phase ships separately and gets checked in the browser as staff and as a trainer.
