import { createFileRoute, Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";
import { useAllCourses } from "@/lib/course-overrides";
import { useCompare } from "@/lib/compare-store";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Courses Side by Side | SOQ International Academy" },
      { name: "description", content: "Compare SOQ course fees, durations, study modes, categories and outcomes side by side." },
      { property: "og:title", content: "Compare SOQ Courses" },
      { property: "og:description", content: "Review prices, durations, modes and outcomes of SOQ courses side by side." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const courses = useAllCourses();
  const { list, toggle, clear, max } = useCompare();
  const selected = list.map((s) => courses.find((c) => c.slug === s)).filter((c): c is NonNullable<typeof c> => !!c);
  const available = courses.filter((c) => !list.includes(c.slug));

  const rows: { label: string; render: (c: (typeof selected)[number]) => React.ReactNode }[] = [
    { label: "Course fee", render: (c) => <strong className="text-primary">{c.price}</strong> },
    { label: "Duration", render: (c) => c.duration },
    { label: "Mode", render: (c) => c.mode },
    { label: "Category", render: (c) => c.category },
    { label: "Certification", render: (c) => c.badge },
    { label: "Outcomes", render: (c) => <ul className="list-disc space-y-1.5 pl-4">{c.outcomes.map((o) => <li key={o}>{o}</li>)}</ul> },
  ];

  return (
    <>
      <PageHero eyebrow="Compare courses" title="Weigh your options side by side." intro={`Select up to ${max} courses to compare fees, durations, modes and outcomes.`} />
      <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Add a course to compare"
            value=""
            disabled={list.length >= max}
            onChange={(e) => e.target.value && toggle(e.target.value)}
            className="h-11 min-w-72 rounded-full border border-border bg-card px-4 text-sm disabled:opacity-50"
          >
            <option value="">{list.length >= max ? `Maximum ${max} courses selected` : "+ Add a course…"}</option>
            {available.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </select>
          {list.length > 0 && <Button variant="ghost" onClick={clear} className="rounded-full">Clear all</Button>}
        </div>

        {selected.length === 0 ? (
          <div className="mt-10 rounded-lg border border-dashed border-border p-10 text-center">
            <p className="font-serif text-2xl text-brand-navy">No courses selected yet</p>
            <p className="mt-2 text-muted-foreground">Add courses above, or tap “Compare” on any course card.</p>
            <Button asChild className="mt-6 rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85"><Link to="/courses">Browse courses</Link></Button>
          </div>
        ) : (
          <div className="mt-10 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-40 p-4" />
                  {selected.map((c) => (
                    <th key={c.slug} className="p-4 text-left align-top font-normal">
                      <img src={c.image} alt="" width={320} height={240} className="aspect-[4/3] w-full rounded object-cover" />
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <Link to="/courses/$slug" params={{ slug: c.slug }} className="font-serif text-lg leading-tight text-brand-navy hover:underline">{c.title}</Link>
                        <button onClick={() => toggle(c.slug)} aria-label={`Remove ${c.title}`} className="rounded-full p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <th scope="row" className="p-4 text-left align-top text-xs font-semibold uppercase tracking-wider text-muted-foreground">{row.label}</th>
                    {selected.map((c) => <td key={c.slug} className="p-4 align-top text-foreground/85">{row.render(c)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
