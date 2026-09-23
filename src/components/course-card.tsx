import { useMergedCourse } from "@/lib/course-overrides";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Clock3, MapPin, Plus } from "lucide-react";
import type { Course } from "@/lib/site-content";
import { useCompare } from "@/lib/compare-store";

export function CompareToggle({ slug }: { slug: string }) {
  const { has, toggle, list, max } = useCompare();
  const on = has(slug);
  const full = !on && list.length >= max;
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={full}
      aria-pressed={on}
      title={full ? `You can compare up to ${max} courses` : undefined}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${on ? "border-brand-navy bg-brand-navy text-primary-foreground" : "border-border text-primary hover:border-brand-gold"}`}
    >
      {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
      {on ? "Added to compare" : "Compare"}
    </button>
  );
}

export function CourseCard({ course: base, showCompare = true }: { course: Course; showCompare?: boolean }) {
  const course = useMergedCourse(base);
  const from = course.price.startsWith("From ");
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-transform duration-300 hover:-translate-y-1">
      <Link to="/courses/$slug" params={{ slug: course.slug }} className="flex flex-1 flex-col">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img src={course.image} alt="" loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="flex flex-1 flex-col p-4">
          <span className="self-start rounded bg-brand-gold-soft px-2 py-0.5 text-[10px] font-bold text-brand-navy">{course.badge}</span>
          <h3 className="mt-3 font-serif text-lg leading-snug text-card-foreground">{course.title}</h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{course.duration}</span><span className="flex items-center gap-1"><MapPin className="size-3.5" />{course.mode}</span></div>
          <div className="mt-auto flex items-end justify-between gap-2 pt-4">
            <div className="text-xs text-muted-foreground">
              {from ? <>From <strong className="font-serif text-lg text-primary">{course.price.slice(5)}</strong><span className="block text-[10px]">(after applicable funding*)</span></> : <span className="text-sm text-primary">{course.price}</span>}
            </div>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-gold text-brand-navy"><ArrowRight className="size-4" /></span>
          </div>
        </div>
      </Link>
      {showCompare && <div className="px-4 pb-4"><CompareToggle slug={course.slug} /></div>}
    </article>
  );
}
