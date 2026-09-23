import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { PageHero } from "@/components/page-hero";
import { categories, courses } from "@/lib/site-content";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/courses/")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Courses | SOQ International Academy" }, { name: "description", content: "Explore practical WSQ, business, beauty, wellness, retail and diploma courses in Singapore." },
    { property: "og:title", content: "Courses | SOQ International Academy" }, { property: "og:description", content: "Find practical courses for your next career or business goal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: CoursesPage,
});

function CoursesPage() {
  const search = Route.useSearch();
  const [active, setActive] = useState(search.category ?? "All");
  const visible = useMemo(() => active === "All" ? courses : courses.filter(c => c.category === active), [active]);
  return <><PageHero eyebrow="Courses" title="Practical skills, built for real work." intro="Explore industry-relevant programmes for career growth, personal development and stronger teams." /><section className="mx-auto max-w-7xl px-5 py-16 lg:px-8"><div className="flex flex-wrap gap-2"><Button variant={active === "All" ? "default" : "outline"} onClick={() => setActive("All")}>All courses</Button>{categories.map(c => <Button key={c.name} variant={active === c.name ? "default" : "outline"} onClick={() => setActive(c.name)}>{c.name}</Button>)}</div><p className="mt-8 text-sm text-muted-foreground">{visible.length} programmes shown</p><div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visible.map(c => <CourseCard key={c.slug} course={c} />)}</div>{visible.length === 0 && <div className="mt-10 border border-border p-10 text-center"><h2 className="font-serif text-3xl">More programmes are being prepared.</h2><Button asChild className="mt-5"><Link to="/contact">Ask a course adviser</Link></Button></div>}</section></>;
}
