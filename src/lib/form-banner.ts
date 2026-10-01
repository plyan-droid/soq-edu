import { courses } from "@/lib/site-content";

/** Banner value is either an existing course photo key or an https image link. */
export const bannerSrc = (b: string | null | undefined): string | null => {
  if (!b) return null;
  if (/^https:\/\//i.test(b)) return b;
  return courses.find(c => c.slug === b)?.image ?? null;
};
