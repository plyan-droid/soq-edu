# Simplify the trainer workspace

## Direction
Use the selected **light-led operations overview**: white working surfaces, soft grey separation, navy text and restrained gold emphasis. Use **Sora** for headings and **Manrope** for working text within the trainer workspace only; keep the public site and other portals unchanged. The result should feel calm and task-oriented rather than like a wall of equally weighted panels.

## What will change
- Rework trainer Home into a compact **Today / Needs attention** area for seat requests, grading and learners needing attention; a small summary strip; and a clear **Upcoming teaching** list. Put lower-priority course details, quiz results, notices and events behind their existing destinations instead of repeating every feed on Home. Keep the getting-started checklist dismissible.
- Simplify the trainer navigation into a short set of clear areas. Keep all existing tools available, but group related actions logically and reduce the number of competing tabs. Preserve existing `?tool=` links and provide aliases for any renamed destinations.
- Make the Classes, Courses and Students views easier to scan: consistent headings, compact filters and action placement, quieter status treatment, readable tables, and deliberate empty/loading states. Avoid nested panels or oversized action buttons.
- Keep seat confirmation, live scheduling, session plans, 1-to-1 bookings, lessons, quizzes, assignments, proposals, progress, attendance, notices and tutor profile workflows intact. Do not invent earnings, sales, visitors or student records.

## Technical approach
- Scope typography and visual tokens to the trainer workspace rather than changing SOQ-wide styling. Reuse existing semantic colours, Button controls and query-backed data; this is a presentation and navigation cleanup, not a permission or backend change.
- Preserve desktop and phone navigation, keyboard access, readable labels and direct links to the relevant work queues.

## Verification
- Check the signed-in trainer Home and each area at desktop and phone widths; confirm all old destinations and actions are reachable and that direct links still open correctly.
- Check empty and populated states, text overflow, controls and preview errors. A live signed-in trainer walkthrough requires preview access to a trainer account; the current isolated browser only displays the log-in prompt.
