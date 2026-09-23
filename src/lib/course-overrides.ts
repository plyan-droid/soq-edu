import { queryOptions, useQuery } from "@tanstack/react-query";
import type { Course } from "@/lib/site-content";
import { courseDetails, type CourseSection } from "@/lib/course-details";
import { getCourseOverrides, type CourseOverride } from "@/lib/course-overrides.functions";

export const courseOverridesQuery = queryOptions({
  queryKey: ["course-overrides"],
  queryFn: () => getCourseOverrides(),
  staleTime: 60_000,
});

export function mergeCourse(course: Course, o?: CourseOverride): Course {
  if (!o) return course;
  return {
    ...course,
    title: o.title || course.title,
    summary: o.summary || course.summary,
    price: o.price || course.price,
    duration: o.duration || course.duration,
    mode: o.mode || course.mode,
    badge: o.badge || course.badge,
    outcomes: o.outcomes?.length ? o.outcomes : course.outcomes,
  };
}

export const sectionsFor = (slug: string, o?: CourseOverride): CourseSection[] =>
  o?.sections?.length ? o.sections : courseDetails[slug] ?? [];

/** Client hook: returns the course with any staff edits applied. */
export function useMergedCourse(course: Course): Course {
  const { data } = useQuery(courseOverridesQuery);
  return mergeCourse(course, data?.find(o => o.slug === course.slug));
}
