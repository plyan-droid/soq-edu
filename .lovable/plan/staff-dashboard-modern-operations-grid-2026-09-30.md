# Staff dashboard: modern operations grid

## What will change
- Redesign the **Today** screen for staff and admins around the selected operations-grid direction: a concise header, four high-value figures, a prominent list of work awaiting attention, and a smaller recent-activity column. Keep the SOQ identity with refined white, off-white, navy and restrained gold, using Space Grotesk for headings and DM Sans for body text in this workspace.
- Put actionable queues ahead of reporting. Show each pending category once, with its real count and a direct link to the existing tool. Move categories with nothing pending out of the main queue rather than giving them equal weight.
- Reduce the current twelve-figure wall to four useful headline figures; keep detailed sales and historical reporting under **Reports**, with appropriate scope labels such as “latest 500” where the data is limited. Group recent enquiries, course proposals, classes and registrations into a concise activity area without inventing activity, alerts, trends or processing times.
- Preserve the six staff navigation groups and admin-only Owner group, existing visible tool tabs, bookmarked `?tool=` links, permissions and tool workflows. Design the same hierarchy for desktop and phones.

## Technical approach
- Make the staff/admin-specific Home presentation in the existing dashboard code rather than restyling student, trainer or organisation Homes. Reuse its recorded counts and lists; no database or business-rule changes.
- Use semantic colour tokens and accessible focus/selection states. Keep all current tools reachable and demo records visibly distinguishable where shown.

## Check before completion
- Compare signed-in staff and admin Today screens at desktop and phone widths; test queue links, Reports, and Owner visibility. Confirm the page uses recorded values and displays sensible empty states. Check the preview for errors.
