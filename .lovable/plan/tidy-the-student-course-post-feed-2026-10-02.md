# Tidy the student course post feed

## Goal
Make each course’s Stream feel like one clear Community feed, without changing how posting, replies, announcements or coursework work.

## Changes
1. Keep the single pinned trainer announcement at the top, but present it in the same visual language as the posts with a small, clear pinned label.
2. Put the post composer and Latest/Top controls on one restrained toolbar. Show regular trainer announcements and student conversations as one chronological feed with consistent spacing, text sizes and metadata.
3. Keep the sample posts for demo learners, but make them visually consistent with real posts and clearly labelled as examples. Remove any extra separation that makes the examples feel like a second feed.
4. Refine the empty and loading states so the page does not show an empty-feed message alongside demo examples.
5. Check the resulting feed on desktop and phone, including posting, replies, sorting and the pinned announcement.

## Technical details
- Adjust the presentation in `student-classroom.tsx`, `classroom-forum.tsx`, `classroom-demo-work.tsx` and the pinned notice rendering in `learner-tools.tsx`.
- Preserve course-scoped access, existing data, actions and the Stream/Classwork/Grades tabs. No database changes.
