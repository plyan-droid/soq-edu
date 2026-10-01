# Student dashboard: Classroom-inspired redesign

## Recommendation
Make the student experience **course-first and task-first**, without copying Google's branding. Keep SOQ's cream, navy and gold styling, British English, and the existing payments, SkillsFuture Credit and certificates areas.

1. **Simplify Home.** Put the next action at the top: work due soon, overdue work, and the next confirmed class. Follow with enrolled course tiles showing course name, progress and the next task. Move the long quiz, assignment and notice lists into their respective course views; keep a short, recent-announcements preview and a compact upcoming schedule. This removes the current repetition between “Continue learning”, “Course overview”, “My assignments”, “My quizzes” and “Coming up”.
2. **Make My courses a class picker.** Replace the present application-and-progress-heavy page with clear enrolled-course tiles that open a course workspace. Preserve application status in a quieter section below the classes, rather than letting it compete with active learning.
3. **Give each course a consistent workspace.** Use **Stream** for trainer announcements and the class discussion; **Classwork** for lessons, materials, assignments and quizzes grouped into scannable topics; **People** for the trainer and appropriate classmates; and **My work** for the student's own submission states, feedback and quiz results. Keep live classes and booking status visible in the course header or Stream sidebar. Only show classmates if course privacy rules permit it.
4. **Make work actionable.** Clicking an assignment or quiz from Home, the course list or a due-soon list should open that exact item, not merely the course's lesson page. In the assignment view, put instructions, due date, submission box, hand-in status and trainer feedback together. Distinguish **To do**, **Handed in**, **Marked** and **Overdue** consistently. Preserve existing written-answer and external-file-link submission initially; direct uploads can be a separate follow-up if wanted.
5. **Improve small screens.** Put the task list and course tabs before secondary calendar/progress information, keep the hand-in action easy to reach, and avoid burying coursework below a long lesson sidebar. Give empty states a single relevant next step.

## Technical approach
Reuse the existing enrolment, lesson, notice, assessment, submission, quiz-attempt, booking and discussion data. Refactor the student Home, My courses and `/learn/$slug` presentation around shared per-course navigation and item-level links; avoid creating duplicate announcement or assessment records. Preserve access checks so only enrolled students see private course content. Keep existing portal sections and public URLs working. Check desktop and phone layouts plus student flows from Home → course → assignment hand-in → feedback, quiz and course discussion.

## What this does not change
No new payment, funding or certificate claims; no alteration to trainer workflows. Direct assignment file upload, notification inbox and offline lessons are outside this redesign unless requested separately.
