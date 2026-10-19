# Make the Diploma Admissions Overview look cleaner

## What makes it look messy now
- Table rows are very tall: programme names break over 4 lines and references split onto 2 lines.
- The table is cut off on the right (Triage button half hidden) because it is squeezed next to the intakes box.
- The intakes box on the right is mostly empty white space and stretches to the table's height.
- 13 stage pills with counts in three rows feel noisy; the progress bar under them means nothing.
- Status colours are random (grey, yellow, black), and grey chips are hard to read.
- Four top cards have a lot of empty space and small, uneven link text.

## Proposed redesign (same data and actions, nothing removed)

```text
[ Header: Diploma Admissions  · New intake ]
[ 4 slim metric cards: number + label + one link, equal height ]
[ Pipeline: one horizontal bar split by stage, legend below, grouped
  into In review / Offer / Enrolled / Closed ]
[ Work queue (full width table)                              ]
[ Open intakes (row of compact cards under the table)        ]
```

1. **Metric cards**: smaller height, big navy number, gold link on the same line; consistent spacing.
2. **Pipeline**: replace 13 pills with a single segmented bar (navy/gold shades) and a compact legend grouped into 4 phases. Empty stages hidden behind "Show all stages".
3. **Work queue full width**: one line per applicant. Columns: Applicant (name + email, reference as small grey text under it), Programme (one line, intake as small text), Status, Waiting since, Action. Row height about half of today. Left-aligned text, no horizontal scroll.
4. **Status chips**: one consistent colour system — neutral (Submitted/Screening/Under review), amber (Missing documents, Interview), navy (Conditional approval/Offer sent/Deposit pending), green (Enrolled), red (Rejected/Withdrawn). Soft background, readable text.
5. **Action**: small outline "Review" button that stays visible; row is also clickable.
6. **Open intakes**: move below the table as compact cards (name, programme, start date, seats bar "1 / 30"), so no empty white column.
7. **Phone**: metric cards 2×2, table becomes stacked cards with name, status and Review button.

## Technical details
- Locate the Diploma Admissions overview component in the staff portal and restyle only presentation; queries and actions unchanged.
- Use existing semantic tokens (primary navy, brand-gold, muted); add success/warning tokens in styles.css if missing.
- Verify on desktop 1280 and phone 390 with the admin demo account.
