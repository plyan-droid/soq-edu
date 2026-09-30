import { queryOptions, useQuery } from "@tanstack/react-query";
import { courses as baseCourses, type Course, type CourseCategory } from "@/lib/site-content";
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

/** A staff-created course built from its override row. */
export function customToCourse(o: CourseOverride): Course {
  const cat = (o.category || "Business") as CourseCategory;
  const img = baseCourses.find(c => c.category === cat)?.image ?? baseCourses[0]!.image;
  return { slug: o.slug, title: o.title || "New course", category: cat, summary: o.summary || "", duration: o.duration || "To be confirmed", mode: o.mode || "Classroom", price: o.price || "Enquire for details", badge: o.badge || "Course", image: img, outcomes: o.outcomes ?? [] };
}

/** Built-in courses with staff edits, minus hidden ones, plus staff-created courses. */
export function allCourses(overrides: CourseOverride[] = [], includeHidden = false): Course[] {
  const by = new Map(overrides.map(o => [o.slug, o]));
  const built = baseCourses.filter(c => includeHidden || !by.get(c.slug)?.hidden).map(c => mergeCourse(c, by.get(c.slug)));
  const extra = overrides.filter(o => o.custom && !baseCourses.some(c => c.slug === o.slug) && (includeHidden || !o.hidden)).map(customToCourse);
  return [...built, ...extra];
}

export function useAllCourses(includeHidden = false): Course[] {
  const { data } = useQuery(courseOverridesQuery);
  return allCourses(data, includeHidden);
}
