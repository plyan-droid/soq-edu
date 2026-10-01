# Student Home: cleaner dashboard

## Direction
Use the selected **Refined dashboard layout** as a structural reference, adapted to SOQ’s existing cream, navy and gold styling, Cormorant Garamond and DM Sans, and the real student information already displayed. Do not copy the preview’s invented classes, counts, payment amounts, events or support hours.

## Changes
1. Simplify the welcome area to one concise greeting and the linked organisation, without a second competing page title inside the content.
2. Replace the current three equal-weight “next steps” columns with a compact, clearly ranked summary: overdue/due assignments and the next confirmed class, each linking to the exact existing destination. Hide empty urgency signals or give them a quiet empty state.
3. Place current courses in a tidy two-column list of consistent height, with title, progress, next relevant work and a clear Open class action. Keep All courses reachable.
4. Put class announcements in a readable feed and move the chronological upcoming list into the quieter right-hand column. Remove the explanatory Schedule block and repeated Live sessions block; the next class appears only once in the priority area and once as its chronological entry if appropriate.
5. Keep unpaid instalments visible only when present, linking to Payments. On narrow screens, stack the same information in priority order without creating a second navigation or squeezing titles.

## Technical details
- Refine the presentation in the student Home component only; retain its existing account-scoped queries, destination links and portal navigation.
- Use existing design tokens, Button variants, typography and British English. Preserve [DEMO] labels and do not present sample information as verified.
- Check signed-in desktop and phone views, course/assignment links and the latest preview diagnostics after implementation.
