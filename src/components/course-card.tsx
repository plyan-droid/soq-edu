import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock3, MapPin } from "lucide-react";
import type { Course } from "@/lib/site-content";

export function CourseCard({ course }: { course: Course }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-border bg-card transition-transform duration-300 hover:-translate-y-1">
      <Link to="/courses/$slug" params={{ slug: course.slug }} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <img src={course.image} alt="" loading="lazy" width={1024} height={768} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </div>
        <div className="p-5">
          <span className="rounded-full bg-brand-gold-soft px-2.5 py-1 text-[11px] font-semibold text-brand-navy">{course.badge}</span>
          <h3 className="mt-4 min-h-14 font-serif text-xl leading-tight text-card-foreground">{course.title}</h3>
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{course.duration}</span><span className="flex items-center gap-1.5"><MapPin className="size-3.5" />{course.mode}</span></div>
          <div className="mt-5 flex items-end justify-between border-t border-border pt-4"><div><span className="block text-[10px] text-muted-foreground">Course fee</span><strong className="text-sm text-primary">{course.price}</strong></div><span className="grid size-9 place-items-center rounded-full bg-brand-gold-soft text-primary"><ArrowUpRight className="size-4" /></span></div>
        </div>
      </Link>
    </article>
  );
}
