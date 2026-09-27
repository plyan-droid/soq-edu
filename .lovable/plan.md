# Workspace header + tool tabs redesign

## What changes

### 1. One small workspace label — no duplication
Today the workspace name appears three times: a large serif "Staff workspace" in the sidebar, again as an eyebrow above the content, and the section name (Home, Learners…) as the page heading.

New pattern (applied to all portals through the shared shell):

```text
Sidebar:                          Content area:
  SOQ International Academy        STAFF DASHBOARD        <- small uppercase eyebrow (the only workspace wording)
  (small muted text only)          Home                   <- serif heading = section name
```

- The large serif workspace title block is removed from the sidebar; only the small "SOQ International Academy" brand line stays.
- The eyebrow wording becomes a dashboard name: "Staff Dashboard" (admin page), "Trainer Dashboard", "Student Dashboard", "Business Dashboard" on the other portals — replacing today's "…workspace" titles.
- Section name stays the big serif heading.

### 2. Long tool tab rows become a dropdown picker
`WorkspaceTabs` (e.g. Students · Course applications · Diploma admissions · … · Certificates, 9–10 items scrolling off-screen) is replaced by a compact picker:

- **4 tools or fewer** → keep the current underline tabs (they fit fine, e.g. Home: Today / Reports).
- **5 or more** → a single bordered pill showing the current tool with a chevron; opening it lists every tool in that area, with the active one highlighted in the same style as the sidebar (bold, secondary background). Implemented with the existing dropdown-menu component and design tokens.

This applies on desktop and phones (phones also lose the sideways-scrolling tab row).

## Files
- `src/components/workspace-shell.tsx` — sidebar header block (small brand line only), WorkspaceShell/WorkspaceNav eyebrow + picker logic; new `WorkspaceToolPicker` used by both the shared shell and the admin page.
- `src/routes/portal-admin.tsx` — duplicate header removed; eyebrow becomes "Staff Dashboard"; uses the new picker.
- Titles passed in `trainer.tsx`, `student-portal.tsx`, `business-workspace.tsx` updated to the Dashboard wording.

## Verification
- Playwright: staff page at desktop and phone widths — one workspace label, picker shows current tool and opens the full list, tools still reachable and URLs keep `?tool=` support; same quick check on trainer/student/business pages. Build clean.
