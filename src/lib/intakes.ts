import { courseDetails } from "@/lib/course-details";

export type Intake = { id: string; course_slug: string; start_date: string; end_date: string | null; apply_by: string | null; session_time: string | null; status: string; notes: string | null };

/** Real class timing taken from the course's syllabus ("Timing: ..."), if published. */
export function classHours(slug: string): string | null {
  for (const s of courseDetails[slug] ?? []) {
    for (const item of s.items) {
      const m = item.match(/Timing:\s*(.+)/i);
      if (m?.[1]) return m[1].trim();
    }
  }
  return null;
}
