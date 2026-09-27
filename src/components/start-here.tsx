import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export type StartCard = { tool: string; title: string; text: string };
export type StartStep = { label: string; done: boolean; tool: string };
export type StartRole = "student" | "trainer" | "business" | "staff";

const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

async function loadSteps(role: StartRole, userId: string): Promise<StartStep[]> {
  const head = { count: "exact" as const, head: true };
  if (role === "student") {
    const [enr, done, certs, sfc] = await Promise.all([
      count(supabase.from("enrollments").select("id", head).eq("student_id", userId)),
      count(supabase.from("enrollments").select("id", head).eq("student_id", userId).gt("progress", 0)),
      count(supabase.from("certificates").select("id", head).eq("student_id", userId)),
      count(supabase.from("sfc_claims").select("id", head).eq("user_id", userId)),
    ]);
    return [
      { label: "Get enrolled in a course", done: enr > 0, tool: "courses" },
      { label: "Start your first lesson", done: done > 0, tool: "courses" },
      { label: "Add your SkillsFuture Credit balance", done: sfc > 0, tool: "sfc" },
      { label: "Earn your first certificate", done: certs > 0, tool: "certs" },
    ];
  }
  if (role === "trainer") {
    const [live, slots, profile] = await Promise.all([
      count(supabase.from("live_sessions").select("id", head).eq("trainer_id", userId)),
      count(supabase.from("meeting_slots").select("id", head).eq("tutor_id", userId)),
      count(supabase.from("tutor_profiles").select("user_id", head).eq("user_id", userId)),
    ]);
    return [
      { label: "Fill in your public tutor listing", done: profile > 0, tool: "slots" },
      { label: "Add lessons to a course", done: live > 0, tool: "lessons" },
      { label: "Schedule a live class", done: live > 0, tool: "live" },
      { label: "Offer 1-to-1 time slots", done: slots > 0, tool: "slots" },
    ];
  }
  if (role === "business") {
    const [members, instructors] = await Promise.all([
      count(supabase.from("org_members").select("id", head).eq("org_id", userId).eq("member_role", "student")),
      count(supabase.from("org_members").select("id", head).eq("org_id", userId).eq("member_role", "instructor")),
    ]);
    return [
      { label: "Check your package and seats", done: true, tool: "package" },
      { label: "Add your first employee", done: members > 0, tool: "members" },
      { label: "Add an in-house instructor (optional)", done: instructors > 0, tool: "instructors" },
      { label: "Review your team's progress", done: members > 0, tool: "progress" },
    ];
  }
  const [apps, pay] = await Promise.all([
    count(supabase.from("course_applications").select("id", head).eq("status", "new")),
    count(supabase.from("sfc_claims").select("id", head).eq("status", "pending")),
  ]);
  return [
    { label: apps ? `Review ${apps} new course application${apps === 1 ? "" : "s"}` : "No new course applications", done: apps === 0, tool: "applications" },
    { label: pay ? `Check ${pay} SkillsFuture claim${pay === 1 ? "" : "s"}` : "No SkillsFuture claims waiting", done: pay === 0, tool: "sfc" },
    { label: "Post a notice for students", done: false, tool: "notices" },
    { label: "Look over this month's reports", done: false, tool: "reports" },
  ];
}

export function StartHere({ role, userId, greeting, cards, onNavigate }: { role: StartRole; userId: string; greeting: string; cards: StartCard[]; onNavigate: (tool: string) => void }) {
  const { data: steps, isPending } = useQuery({ queryKey: ["start-here", role, userId], queryFn: () => loadSteps(role, userId) });
  const doneCount = steps?.filter(s => s.done).length ?? 0;
  return (
    <div className="mt-4 space-y-8">
      <p className="max-w-2xl text-lg text-muted-foreground">{greeting}</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(c => (
          <button key={c.title} type="button" onClick={() => onNavigate(c.tool)} className="group flex flex-col items-start rounded-xl border border-border bg-card p-5 text-left transition hover:border-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="font-serif text-2xl font-semibold text-primary">{c.title}</span>
            <span className="mt-1 text-sm text-muted-foreground">{c.text}</span>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-foreground">Open <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
          </button>
        ))}
      </div>
      <section className="rounded-xl border border-border bg-secondary/40 p-5" aria-label="Getting started">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-serif text-2xl font-semibold text-primary">{role === "staff" ? "Today's to-do" : "Getting started"}</h2>
          {steps && <p className="text-sm text-muted-foreground">{doneCount} of {steps.length} done</p>}
        </div>
        {steps && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} /></div>}
        <ul className="mt-4 grid gap-2">
          {isPending ? [0, 1, 2, 3].map(i => <li key={i}><Skeleton className="h-10 w-full" /></li>) : steps?.map(s => (
            <li key={s.label}>
              <button type="button" onClick={() => onNavigate(s.tool)} className="flex w-full items-center gap-3 rounded-md bg-background px-3 py-2.5 text-left text-sm hover:bg-card">
                {s.done ? <CheckCircle2 className="size-5 shrink-0 text-accent" aria-label="Done" /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Not done" />}
                <span className={s.done ? "text-muted-foreground line-through" : "font-medium"}>{s.label}</span>
                <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Skeleton shown while a portal page loads, instead of bare "Loading…" text. */
export function PageSkeleton() {
  return <div className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8" aria-busy="true" aria-label="Loading">
    <div className="grid gap-10 lg:grid-cols-[15.5rem_1fr]">
      <div className="hidden space-y-3 lg:block">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-9 w-full" />)}</div>
      <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-48 w-full" /></div>
    </div>
  </div>;
}

export function ListSkeleton() {
  return <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;
}
