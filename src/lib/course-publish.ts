import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { cleanCourse, type CourseFields } from "@/components/course-form";

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "course";

/** Staff/admin only: creates a live course (plus optional first intake). Returns the new page address. */
export async function createLiveCourse(f: CourseFields): Promise<{ slug?: string; error?: string }> {
  const c = cleanCourse(f);
  if (c.error) return { error: c.error };
  const { data: taken } = await supabase.from("course_overrides").select("slug");
  const used = new Set([...courses.map(x => x.slug), ...(taken ?? []).map(x => x.slug)]);
  const base = slugify(f.title); let slug = base; let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  const { error } = await supabase.from("course_overrides").insert({
    slug, custom: true, hidden: false, category: f.category, title: f.title.trim(), summary: f.summary.trim(), price: f.price.trim(),
    duration: f.duration.trim() || null, mode: f.mode.trim() || null, badge: f.badge.trim() || null, level: f.level.trim() || null,
    requirements: f.requirements.trim() || null, image_key: f.image_key || null, outcomes: c.outcomes, sections: c.sections, faqs: c.faqs,
  });
  if (error) return { error: error.message };
  if (f.intake_start) {
    await supabase.from("course_intakes").insert({ course_slug: slug, start_date: f.intake_start, apply_by: f.intake_apply_by || null, session_time: f.intake_time.trim() || null, status: "confirmed" });
  }
  return { slug };
}
