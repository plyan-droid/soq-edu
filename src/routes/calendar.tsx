import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, Clock, AlertCircle, MessageCircle } from "lucide-react";
import { z } from "zod";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses, categories, contact } from "@/lib/site-content";
import { classHours, type Intake } from "@/lib/intakes";

export const Route = createFileRoute("/calendar")({
  validateSearch: z.object({ path: z.string().optional(), view: z.enum(["intakes", "hours"]).optional() }),
  head: () => ({
    meta: [
      { title: "Course Calendar | SOQ International Academy" },
      { name: "description", content: "Upcoming SOQ course intakes, application deadlines and class hours to help you plan your studies." },
      { property: "og:title", content: "SOQ Course Calendar — Intakes, Class Hours & Deadlines" },
      { property: "og:description", content: "Plan your studies with SOQ's upcoming intakes, apply-by dates and class timings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CalendarPage,
});

const statusStyle: Record<string, string> = {
  tentative: "bg-muted text-muted-foreground",
  confirmed: "bg-brand-gold-soft text-primary",
  full: "bg-destructive/10 text-destructive",
};
const statusText: Record<string, string> = { tentative: "To be confirmed", confirmed: "Confirmed", full: "Class full" };
const d = (s: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(s + (s.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-SG", opts);

function CalendarPage() {
  const { path, view = "intakes" } = Route.useSearch();
  const nav = Route.useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const { data: intakes = [], isLoading } = useQuery({
    queryKey: ["intakes"],
    queryFn: async () => ((await supabase.from("course_intakes").select("*").gte("start_date", new Date().toISOString().slice(0, 10)).order("start_date")).data ?? []) as Intake[],
  });

  const { data: myTasks = [] } = useQuery({
    queryKey: ["calendar-my-tasks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: enr } = await supabase.from("enrollments").select("id,course_slug").eq("student_id", user!.id);
      const ids = (enr ?? []).map(e => e.id);
      if (!ids.length) return [];
      const { data } = await supabase.from("course_tasks").select("id,title,kind,due_at,enrollment_id,status").in("enrollment_id", ids).eq("status", "upcoming").order("due_at").limit(8);
      return (data ?? []).map(t => ({ ...t, course: courses.find(c => c.slug === enr!.find(e => e.id === t.enrollment_id)?.course_slug)?.title ?? "" }));
    },
  });

  const filtered = useMemo(() => intakes.filter(i => {
    const c = courses.find(x => x.slug === i.course_slug);
    return c && (!path || c.category === path) && c.title.toLowerCase().includes(q.toLowerCase());
  }), [intakes, path, q]);

  const byMonth = useMemo(() => {
    const m = new Map<string, Intake[]>();
    filtered.forEach(i => { const k = d(i.start_date, { month: "long", year: "numeric" }); m.set(k, [...(m.get(k) ?? []), i]); });
    return [...m.entries()];
  }, [filtered]);

  const hourCourses = courses.filter(c => (!path || c.category === path) && c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHero eyebrow="Plan your studies" title="Course calendar" intro="Upcoming intakes, application deadlines and class hours across every SOQ study path." />
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-border p-1">
            {(["intakes", "hours"] as const).map(v => (
              <button key={v} onClick={() => void nav({ search: s => ({ ...s, view: v }) })} className={`rounded-full px-4 py-1.5 text-sm ${view === v ? "bg-brand-navy text-primary-foreground" : "text-muted-foreground"}`}>
                {v === "intakes" ? "Upcoming intakes" : "Class hours by course"}
              </button>
            ))}
          </div>
          <select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={path ?? ""} onChange={e => void nav({ search: s => ({ ...s, path: e.target.value || undefined }) })}>
            <option value="">All study paths</option>
            {categories.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
          <input className="h-10 flex-1 min-w-48 rounded-md border border-input bg-background px-3 text-sm" placeholder="Search a course" value={q} onChange={e => setQ(e.target.value)} />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div>
            {view === "intakes" ? (
              isLoading ? <p className="text-muted-foreground">Loading intakes…</p> : byMonth.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8">
                  <h2 className="font-serif text-3xl text-primary">No scheduled intakes match</h2>
                  <p className="mt-2 text-muted-foreground">Many SOQ courses run on request. Message us and an adviser will share the next available dates.</p>
                </div>
              ) : byMonth.map(([month, list]) => (
                <section key={month} className="mb-10">
                  <h2 className="font-serif text-3xl text-primary">{month}</h2>
                  <div className="mt-4 grid gap-3">
                    {list.map(i => {
                      const c = courses.find(x => x.slug === i.course_slug)!;
                      const time = i.session_time ?? classHours(c.slug);
                      return (
                        <article key={i.id} className="grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[88px_1fr_auto] sm:items-center">
                          <div className="rounded-md bg-brand-navy p-3 text-center text-primary-foreground">
                            <p className="text-xs uppercase tracking-wider text-brand-gold">{d(i.start_date, { month: "short" })}</p>
                            <p className="font-serif text-3xl leading-none">{d(i.start_date, { day: "numeric" })}</p>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${statusStyle[i.status] ?? ""}`}>{statusText[i.status] ?? i.status}</span>
                              <span className="text-xs text-muted-foreground">{c.category} · {c.mode}</span>
                            </div>
                            <Link to="/courses/$slug" params={{ slug: c.slug }} className="mt-1 block font-serif text-2xl text-primary hover:text-brand-gold">{c.title}</Link>
                            <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarDays className="size-4" />{d(i.start_date)}{i.end_date && i.end_date !== i.start_date ? ` – ${d(i.end_date)}` : ""} · {c.duration}</span>
                              {time && <span className="flex items-center gap-1"><Clock className="size-4" />{time}</span>}
                            </p>
                            {i.apply_by && <p className="mt-1 flex items-center gap-1 text-sm font-medium text-primary"><AlertCircle className="size-4 text-brand-gold" />Apply by {d(i.apply_by, { weekday: "short", day: "numeric", month: "short" })}</p>}
                            {i.notes && <p className="mt-1 text-sm text-muted-foreground">{i.notes}</p>}
                          </div>
                          <Button asChild className="rounded-full" disabled={i.status === "full"}>
                            <Link to="/courses/$slug" params={{ slug: c.slug }}>{i.status === "full" ? "View course" : "Apply"}</Link>
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted"><tr>{["Course", "Duration", "Class hours", "Mode"].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
                  <tbody>{hourCourses.map(c => (
                    <tr key={c.slug} className="border-t border-border align-top">
                      <td className="p-3"><Link to="/courses/$slug" params={{ slug: c.slug }} className="text-primary hover:text-brand-gold">{c.title}</Link><div className="text-xs text-muted-foreground">{c.category}</div></td>
                      <td className="p-3">{c.duration}</td>
                      <td className="p-3">{classHours(c.slug) ?? <span className="text-muted-foreground">Shared when you register</span>}</td>
                      <td className="p-3">{c.mode}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>

          <aside className="grid content-start gap-5">
            {user && (
              <div className="rounded-lg bg-brand-navy p-6 text-primary-foreground">
                <h3 className="font-serif text-2xl">My deadlines</h3>
                {myTasks.length === 0 ? <p className="mt-3 text-sm text-primary-foreground/70">No upcoming deadlines on your account.</p> : (
                  <ul className="mt-4 grid gap-3">{myTasks.map(t => (
                    <li key={t.id} className="rounded-md bg-primary-foreground/5 p-3">
                      <p className="text-xs uppercase tracking-wider text-brand-gold">{t.kind} · {new Date(t.due_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</p>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-xs text-primary-foreground/70">{t.course}</p>
                    </li>
                  ))}</ul>
                )}
                <Button asChild variant="secondary" className="mt-4 w-full rounded-full"><Link to="/student-portal">Open my portal</Link></Button>
              </div>
            )}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-serif text-2xl text-primary">Good to know</h3>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <li>Apply before the apply-by date so funding can be processed before class starts.</li>
                <li>Funding such as SkillsFuture Credit is applied at registration, not refunded later.</li>
                <li>A minimum of 75% attendance is required to complete and to keep funding.</li>
                <li>Dates marked "To be confirmed" may change. An adviser confirms your class before you pay.</li>
              </ul>
              <Link to="/funding" className="mt-3 inline-block text-sm font-medium text-primary underline">Funding details</Link>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-serif text-2xl text-primary">Can't find a date?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Many courses open on request. Ask us for the next class.</p>
              <Button asChild className="mt-4 w-full rounded-full"><a href={`${contact.whatsapp}?text=${encodeURIComponent("Hi SOQ, I'd like to know the next intake dates.")}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp us</a></Button>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
