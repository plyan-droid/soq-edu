import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Circle, X, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { courses } from "@/lib/site-content";
import { useWorkspaceNavigate } from "@/components/workspace-shell";

export type StartRole = "student" | "trainer" | "business" | "staff";
type Card = { tool: string; title: string; text: string; count?: number | undefined; badge?: string | undefined };
type Step = { label: string; done: boolean; tool: string };
type Home = { cards: Card[]; steps: Step[]; highlights?: { title: string; detail: string; tool: string }[]; metrics?: { label: string; value: string }[]; identity?: string | undefined };

const head = { count: "exact" as const, head: true };
const n = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;
const title = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const day = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short" });
const plural = (k: number, w: string) => `${k} ${w}${k === 1 ? "" : "s"}`;

async function load(role: StartRole, uid: string, email = "", owner = false): Promise<Home> {
  const now = new Date().toISOString();
  if (role === "trainer") {
    const [reqs, live, slots, profile, lessons, drafts, courseRows] = await Promise.all([
      n(supabase.from("session_bookings").select("id, live_sessions!inner(trainer_id,starts_at)", head).eq("status", "requested").eq("live_sessions.trainer_id", uid).gte("live_sessions.starts_at", now)),
      n(supabase.from("live_sessions").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("meeting_slots").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("tutor_profiles").select("user_id", head).eq("user_id", uid)),
      n(supabase.from("lessons").select("id", head).eq("created_by", uid)),
      n(supabase.from("course_drafts").select("id", head).eq("trainer_id", uid)),
      n(supabase.from("trainer_courses").select("course_slug", head).eq("trainer_id", uid)),
    ]);
    const roster = ((await supabase.rpc("trainer_roster" as never)).data ?? []) as unknown as { progress: number; status: string }[];
    const upcoming = await supabase.from("live_sessions").select("title,starts_at").eq("trainer_id", uid).neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(3);
    const behind = roster.filter(r => r.status !== "completed" && r.progress < 30).length;
    return {
      cards: [
        { tool: "live", title: "Confirm seat requests", text: reqs ? "Students are waiting to hear back about a class." : "No one is waiting right now.", count: reqs },
        { tool: "live", title: "Add a class", text: "Schedule a live class with a date, time and meeting link." },
        { tool: "students", title: "Check students", text: behind ? `${plural(behind, "student")} under 30% progress.` : "See everyone's progress at a glance.", count: behind },
        { tool: "lessons", title: "Add a lesson", text: "Notes, a video or materials for one of your courses." },
      ],
      metrics: [{ label: "Courses", value: String(courseRows) }, { label: "Students", value: String(roster.length) }, { label: "Upcoming classes", value: String(upcoming.data?.length ?? 0) }],
      highlights: (upcoming.data ?? []).map(s => ({ title: s.title, detail: `Live class · ${day(s.starts_at)}`, tool: "live" })),
      steps: [
        { label: "Fill in your public tutor profile", done: profile > 0, tool: "profile" },
        { label: "Get a course assigned or propose one", done: courseRows + drafts > 0, tool: "drafts" },
        { label: "Add your first lesson", done: lessons > 0, tool: "lessons" },
        { label: "Schedule a live class", done: live > 0, tool: "live" },
        { label: "Offer a 1-to-1 time slot", done: slots > 0, tool: "slots" },
      ],
    };
  }
  if (role === "student") {
    const [enr, certs, sfc, inst, prof, org] = await Promise.all([
      supabase.from("enrollments").select("id,course_slug,progress,status").eq("student_id", uid).order("progress", { ascending: false }),
      n(supabase.from("certificates").select("id", head).eq("student_id", uid).eq("status", "valid")),
      n(supabase.from("sfc_claims").select("id", head).eq("user_id", uid)),
      supabase.from("instalments").select("amount,due_date").eq("user_id", uid).eq("paid", false).order("due_date").limit(1),
      supabase.from("profiles").select("full_name").eq("id", uid).maybeSingle(),
      email ? supabase.from("org_members").select("org_id").eq("member_role", "student").ilike("member_email", email).limit(1) : Promise.resolve({ data: [] }),
    ]);
    const orgId = org.data?.[0]?.org_id;
    const orgName = orgId ? (await supabase.from("profiles").select("full_name,email").eq("id", orgId).maybeSingle()).data : null;
    const rows = (enr.data ?? []) as { course_slug: string; progress: number; status: string }[];
    const current = rows.find(r => r.status !== "completed" && r.progress < 100) ?? rows[0];
    const slugs = rows.map(r => r.course_slug);
    const [taskRows, bookingRows] = await Promise.all([
      rows.length ? supabase.from("course_tasks").select("title,kind,due_at,enrollment_id,status").in("enrollment_id", (enr.data ?? []).map(r => r.id)).eq("status", "upcoming").gte("due_at", now).order("due_at").limit(3) : Promise.resolve({ data: [] }),
      supabase.from("session_bookings").select("session_id").eq("student_id", uid).eq("status", "confirmed"),
    ]);
    const bookingIds = (bookingRows.data ?? []).map(b => b.session_id);
    const nextSessions = bookingIds.length ? (await supabase.from("live_sessions").select("title,starts_at").in("id", bookingIds).neq("status", "cancelled").gte("starts_at", now).order("starts_at").limit(3)).data ?? [] : [];
    const next = nextSessions[0];
    const due = inst.data?.[0];
    return {
      cards: [
        current ? { tool: "courses", title: `Continue ${title(current.course_slug)}`, text: `You're ${current.progress}% through.`, badge: `${current.progress}%` } : { tool: "courses", title: "Find your course", text: "You're not enrolled yet. See your applications here." },
        { tool: "courses", title: next ? `Next booked class · ${day(next.starts_at)}` : "Live classes", text: next ? next.title : "No confirmed class yet. Request a seat from a lesson page." },
        { tool: "certs", title: "Get your certificate", text: certs ? `You have ${plural(certs, "certificate")} ready to download.` : "Finish a course and pass its quiz to earn one." },
        { tool: "pay", title: due ? `Pay instalment due ${day(due.due_date)}` : "Payments", text: due ? `S$${due.amount} by PayNow or bank transfer.` : "Nothing due right now.", count: due ? 1 : 0 },
      ],
      identity: orgName?.full_name || orgName?.email,
      metrics: [{ label: "My courses", value: String(rows.length) }, { label: "Tasks due", value: String((taskRows.data ?? []).length) }, { label: "Certificates", value: String(certs) }],
      highlights: [
        ...(taskRows.data ?? []).map(t => ({ title: t.title, detail: `${t.kind} · due ${day(t.due_at)}`, tool: "courses" })),
        ...nextSessions.map(s => ({ title: s.title, detail: `Confirmed class · ${day(s.starts_at)}`, tool: "courses" })),
      ],
      steps: [
        { label: "Add your full name to your profile", done: !!prof.data?.full_name, tool: "courses" },
        { label: "Open your first lesson", done: rows.some(r => r.progress > 0), tool: "courses" },
        { label: "Add your SkillsFuture Credit balance", done: sfc > 0, tool: "sfc" },
      ],
    };
  }
  if (role === "business") {
    const [members, pkg, roster] = await Promise.all([
      supabase.from("org_members").select("member_email,member_role").eq("org_id", uid),
      supabase.from("org_packages").select("student_seats").eq("org_id", uid).maybeSingle(),
      supabase.rpc("org_roster"),
    ]);
    const students = (members.data ?? []).filter(m => m.member_role === "student").length;
    const left = Math.max(0, (pkg.data?.student_seats ?? 0) - students);
    const linked = (roster.data ?? []).filter(r => r.course_slug);
    const lagging = linked.filter(r => (r.progress ?? 0) < 30 && r.status !== "completed");
    return {
      cards: [
        { tool: "members", title: "Add employees", text: pkg.data ? `${plural(left, "seat")} left on your package.` : "Give your staff a place on SOQ training.", count: students === 0 ? 1 : 0, badge: pkg.data ? `${left} left` : undefined },
        { tool: "progress", title: "See who's behind", text: lagging.length ? `${plural(lagging.length, "course enrolment")} below 30% progress.` : "Course progress for everyone on your team.", count: lagging.length },
        { tool: "certificates", title: "Team certificates", text: "Verify and download certificates your team has earned." },
      ],
      metrics: [{ label: "Learners", value: String(students) }, { label: "Instructors", value: String((members.data ?? []).filter(m => m.member_role === "instructor").length) }, { label: "Course enrolments", value: String(linked.length) }],
      highlights: linked.slice(0, 3).map(r => ({ title: r.full_name || r.member_email, detail: `${title(r.course_slug ?? "")} · ${r.progress ?? 0}%`, tool: "progress" })),
      steps: [
        { label: "Check your package and seats", done: !!pkg.data, tool: "package" },
        { label: "Add your first employee", done: students > 0, tool: "members" },
        { label: "Ask SOQ to enrol them in a course", done: false, tool: "progress" },
      ],
    };
  }
  const [apps, pays, sfc, tickets, trainers, ownerRequests] = await Promise.all([
    n(supabase.from("course_applications").select("id", head).eq("status", "new")),
    n(supabase.from("bank_payments").select("id", head).eq("status", "pending")),
    n(supabase.from("sfc_claims").select("id", head).eq("status", "submitted")),
    n(supabase.from("support_tickets").select("id", head).eq("status", "open")),
    n(supabase.from("trainer_applications").select("id", head).eq("status", "pending")),
    owner ? n(supabase.from("staff_requests").select("id", head).eq("status", "pending")) : Promise.resolve(0),
  ]);
  return {
    cards: [
      { tool: "applications", title: "Approve applications", text: apps ? `${plural(apps, "new application")} to review.` : "All caught up.", count: apps },
      { tool: "payments", title: "Confirm payments", text: pays ? `${plural(pays, "PayNow or bank payment")} to check.` : "No payments waiting.", count: pays },
      { tool: "sfc", title: "Check SkillsFuture claims", text: sfc ? `${plural(sfc, "claim")} waiting for review.` : "No claims waiting.", count: sfc },
      { tool: "inbox", title: "Reply to enquiries", text: tickets ? `${plural(tickets, "open enquiry")} to review.` : "No enquiries waiting.", count: tickets },
      { tool: "trainers", title: "Review trainer applications", text: trainers ? `${plural(trainers, "trainer application")} waiting.` : "No applications waiting.", count: trainers },
      ...(owner ? [{ tool: "users", title: "Review staff access", text: ownerRequests ? `${plural(ownerRequests, "access request")} waiting.` : "Manage owner-only accounts and permissions.", count: ownerRequests }] : []),
    ],
    metrics: [{ label: "Course applications", value: String(apps) }, { label: "Payment checks", value: String(pays) }, { label: owner ? "Access requests" : "Open enquiries", value: String(owner ? ownerRequests : tickets) }],
    steps: [],
  };
}

export function StartHere({ role, userId, email, greeting, onNavigate: fallback, stats, owner = false }: { role: StartRole; userId: string; email?: string; greeting: string; onNavigate: (tool: string) => void; stats?: React.ReactNode; owner?: boolean }) {
  const onNavigate = useWorkspaceNavigate() ?? fallback;
  const { data, isPending } = useQuery({ queryKey: ["start-here", role, userId, email, owner], queryFn: () => load(role, userId, email, owner) });
  const key = `soq-checklist-hidden:${role}:${userId}`;
  const [hidden, setHidden] = useState(false);
  useEffect(() => { setHidden(localStorage.getItem(key) === "1"); }, [key]);
  const hide = (v: boolean) => { setHidden(v); if (v) localStorage.setItem(key, "1"); else localStorage.removeItem(key); };
  // Urgent cards (with a count) come first.
  const cards = data ? role === "student" ? data.cards : [...data.cards].sort((a, b) => Number(!!b.count) - Number(!!a.count)) : [];
  const steps = data?.steps ?? [];
  const done = steps.filter(s => s.done).length;
  const allDone = steps.length > 0 && done === steps.length;
  const showList = steps.length > 0 && !allDone && !hidden;
  const checklist = showList && (
    <section className="rounded-xl border border-accent/50 bg-secondary/50 p-5" aria-label="Getting started">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="min-w-0"><h2 className="font-serif text-2xl font-semibold text-primary">Getting started</h2><p className="text-sm text-muted-foreground">{done} of {steps.length} done</p></div>
        <button type="button" onClick={() => hide(true)} className="rounded-md p-1 text-muted-foreground hover:text-foreground" aria-label="Hide checklist"><X className="size-5" /></button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
      <ul className="mt-4 grid gap-2">{steps.map(s => (
        <li key={s.label}><button type="button" onClick={() => onNavigate(s.tool)} className="flex w-full items-center gap-3 rounded-md bg-background px-3 py-2.5 text-left text-sm hover:bg-card">
          {s.done ? <CheckCircle2 className="size-5 shrink-0 text-accent" aria-label="Done" /> : <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="Not done" />}
          <span className={`min-w-0 ${s.done ? "text-muted-foreground line-through" : "font-medium"}`}>{s.label}</span>
          <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button></li>))}</ul>
    </section>
  );
  return (
    <div className="mt-2 space-y-6">
      <div className="border-b border-border pb-5"><p className="text-xs font-semibold uppercase text-brand-gold">{data?.identity ? `Learning with ${data.identity}` : owner ? "Owner overview" : role === "business" ? "Team learning" : role === "trainer" ? "Teaching today" : role === "student" ? "Your learning" : "Daily operations"}</p><p className="mt-2 max-w-2xl text-muted-foreground">{greeting}</p></div>
      {data?.metrics && <div className="grid grid-cols-2 gap-3 border-b border-border pb-6 sm:grid-cols-3" aria-label="At a glance">{data.metrics.map(m => <div key={m.label} className="border-l-2 border-brand-gold pl-4"><p className="font-serif text-3xl text-primary">{m.value}</p><p className="text-xs text-muted-foreground">{m.label}</p></div>)}</div>}
      <section aria-label="Next actions">
        <h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">{cards.some(c => c.count) ? "Needs your attention" : "Next steps"}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {isPending ? [0, 1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-md" />) : cards.map(c => (
            <Button key={c.title} variant="outline" type="button" onClick={() => onNavigate(c.tool)} className={`group grid h-auto min-h-28 w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-3 whitespace-normal rounded-md p-5 text-left transition hover:border-accent ${c.count ? "border-accent" : "border-border"}`}>
              <span className="min-w-0">
                <span className="block font-serif text-2xl font-semibold leading-tight text-primary">{c.title}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{c.text}</span>
              </span>
              {c.count ? <span className="grid min-w-8 place-items-center rounded-full bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">{c.count}</span>
                : c.badge ? <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-primary">{c.badge}</span>
                : <ArrowRight className="mt-1 size-5 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />}
            </Button>
          ))}
        </div>
      </section>
      {data?.highlights && <section className="border-t border-border pt-5" aria-label="Coming up"><h2 className="font-serif text-2xl text-primary">{role === "business" ? "Team progress" : role === "student" ? "Tasks & booked classes" : "Upcoming classes"}</h2>{data.highlights.length ? <ul className="mt-3 divide-y divide-border">{data.highlights.map((h, i) => <li key={`${h.title}-${i}`}><Button variant="ghost" onClick={() => onNavigate(h.tool)} className="flex h-auto w-full justify-between gap-3 rounded-none px-0 py-3 text-left"><span className="min-w-0 whitespace-normal"><strong className="block font-medium">{h.title}</strong><span className="text-xs text-muted-foreground">{h.detail}</span></span><ArrowRight className="size-4 shrink-0" /></Button></li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">{role === "business" ? "No linked course enrolments yet. Add team members, then ask SOQ to enrol them." : role === "trainer" ? "No upcoming classes. Schedule one from Classes." : "No tasks or confirmed classes coming up. Open a course to see what’s next."}</p>}</section>}
      {checklist}
      {steps.length > 0 && !showList && <Button variant="link" className="h-auto p-0 text-sm" onClick={() => hide(false)}>{allDone ? "All set-up steps done ✓" : "Show getting-started checklist"}</Button>}
      {stats && <section aria-label="At a glance"><h2 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">At a glance</h2>{stats}</section>}
    </div>
  );
}

/** Grey outline shown while a portal loads, instead of bare "Loading…" text. */
export function PageSkeleton() {
  return <div className="mx-auto max-w-[92rem] px-5 py-10 lg:px-8" aria-busy="true" aria-label="Loading">
    <div className="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <div className="hidden space-y-3 lg:block">{[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
      <div className="space-y-4"><Skeleton className="h-12 w-2/3" /><div className="grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}</div></div>
    </div>
  </div>;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="mt-6 space-y-3" aria-busy="true" aria-label="Loading">{Array.from({ length: rows }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>;
}

export function DetailSkeleton() {
  return <div className="mx-auto max-w-5xl space-y-4 px-5 py-16" aria-busy="true" aria-label="Loading"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-64 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-4/5" /></div>;
}

/** Friendly hint + button for an empty list. */
export function EmptyState({ text, action, onAction, icon: Icon }: { text: string; action?: string; onAction?: () => void; icon?: LucideIcon }) {
  return <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
    {Icon && <Icon className="mx-auto mb-2 size-6 text-muted-foreground" aria-hidden="true" />}
    <p className="text-sm text-muted-foreground">{text}</p>
    {action && onAction && <Button size="sm" className="mt-3 rounded-full" onClick={onAction}>{action}</Button>}
  </div>;
}
