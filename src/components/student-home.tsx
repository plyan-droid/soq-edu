import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, ClipboardList, Megaphone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { useWorkspaceNavigate } from "@/components/workspace-shell";
import { NoticeBody } from "@/components/notice-body";

const courseName = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const dateText = (value: string) => new Date(value).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
type AgendaItem = { id: string; date: string; title: string; detail: string; kind: string; slug?: string; target?: string };

async function loadStudentHome(userId: string, email: string) {
  const now = new Date().toISOString();
  const [enrolments, profile, org, certificates, meetings, bookings, signups, notices, credit, instalments] = await Promise.all([
    supabase.from("enrollments").select("id,course_slug,progress,status").eq("student_id", userId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    email ? supabase.from("org_members").select("org_id").eq("member_role", "student").ilike("member_email", email).limit(1) : Promise.resolve({ data: [] as { org_id: string }[] }),
    supabase.from("certificates").select("id", { count: "exact", head: true }).eq("student_id", userId).eq("status", "valid"),
    supabase.from("meeting_slots").select("id,topic,starts_at,trainer_name").eq("booked_by", userId).gte("starts_at", now).order("starts_at").limit(20),
    supabase.from("session_bookings").select("session_id,status").eq("student_id", userId).in("status", ["confirmed", "requested"]),
    supabase.from("event_signups").select("event_id").eq("user_id", userId),
    supabase.from("site_notices").select("id,title,body,ends_on").order("created_at", { ascending: false }).limit(12),
    supabase.from("sfc_balances").select("balance").eq("user_id", userId).maybeSingle(),
    supabase.from("instalments").select("amount,due_date").eq("user_id", userId).eq("paid", false).order("due_date").limit(20),
  ]);
  if (enrolments.error) throw enrolments.error;
  const rows = enrolments.data ?? [];
  const slugs = [...new Set(rows.map(row => row.course_slug))];
  const enrolmentIds = rows.map(row => row.id);
  const bookingIds = [...new Set((bookings.data ?? []).map(row => row.session_id))];
  const eventIds = [...new Set((signups.data ?? []).map(row => row.event_id))];
  const orgId = org.data?.[0]?.org_id;
  const [tasks, assignments, quizzes, courseNotices, lessons, progress, sessions, events, orgProfile] = await Promise.all([
    enrolmentIds.length ? supabase.from("course_tasks").select("id,title,kind,due_at,status,enrollment_id").in("enrollment_id", enrolmentIds).order("due_at").limit(100) : Promise.resolve({ data: [] as { id: string; title: string; kind: string; due_at: string; status: string; enrollment_id: string }[] }),
    slugs.length ? supabase.from("assignments").select("id,title,course_slug,due_at,max_score").in("course_slug", slugs).order("due_at", { nullsFirst: false }).limit(60) : Promise.resolve({ data: [] as { id: string; title: string; course_slug: string; due_at: string | null; max_score: number }[] }),
    slugs.length ? supabase.from("quizzes").select("id,title,course_slug").in("course_slug", slugs).limit(60) : Promise.resolve({ data: [] as { id: string; title: string; course_slug: string }[] }),
    slugs.length ? supabase.from("course_notices").select("id,title,body,course_slug,created_at").in("course_slug", slugs).order("created_at", { ascending: false }).limit(8) : Promise.resolve({ data: [] as { id: string; title: string; body: string; course_slug: string; created_at: string }[] }),
    slugs.length ? supabase.from("lessons").select("id,course_slug").in("course_slug", slugs).limit(200) : Promise.resolve({ data: [] as { id: string; course_slug: string }[] }),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", userId).limit(200),
    bookingIds.length ? supabase.from("live_sessions").select("id,title,course_slug,starts_at,status").in("id", bookingIds).gte("starts_at", now).neq("status", "cancelled").order("starts_at") : Promise.resolve({ data: [] as { id: string; title: string; course_slug: string; starts_at: string; status: string }[] }),
    eventIds.length ? supabase.from("events").select("id,title,starts_at,location").in("id", eventIds).gte("starts_at", now).order("starts_at") : Promise.resolve({ data: [] as { id: string; title: string; starts_at: string; location: string }[] }),
    orgId ? supabase.from("profiles").select("full_name,email").eq("id", orgId).maybeSingle() : Promise.resolve({ data: null as { full_name: string | null; email: string } | null }),
  ]);
  const assignmentIds = (assignments.data ?? []).map(row => row.id);
  const quizIds = (quizzes.data ?? []).map(row => row.id);
  const [submissions, attempts] = await Promise.all([
    assignmentIds.length ? supabase.from("assignment_submissions").select("assignment_id,status,score").eq("student_id", userId).in("assignment_id", assignmentIds) : Promise.resolve({ data: [] as { assignment_id: string; status: string; score: number | null }[] }),
    quizIds.length ? supabase.from("quiz_attempts").select("quiz_id,score,passed").eq("student_id", userId).in("quiz_id", quizIds) : Promise.resolve({ data: [] as { quiz_id: string; score: number; passed: boolean }[] }),
  ]);
  const agenda: AgendaItem[] = [
    ...(tasks.data ?? []).filter(t => t.status === "upcoming" && t.due_at >= now).map(t => ({ id: `task-${t.id}`, date: t.due_at, title: t.title, detail: t.kind, kind: "Deadline", slug: rows.find(r => r.id === t.enrollment_id)?.course_slug })),
    ...(assignments.data ?? []).filter(a => a.due_at && a.due_at >= now && !(submissions.data ?? []).some(s => s.assignment_id === a.id)).map(a => ({ id: `assignment-${a.id}`, date: a.due_at as string, title: a.title, detail: courseName(a.course_slug), kind: "Assignment", slug: a.course_slug, target: `assignment-${a.id}` })),
    ...(sessions.data ?? []).filter(s => (bookings.data ?? []).some(b => b.session_id === s.id && b.status === "confirmed")).map(s => ({ id: `class-${s.id}`, date: s.starts_at, title: s.title, detail: courseName(s.course_slug), kind: "Live class", slug: s.course_slug })),
    ...(meetings.data ?? []).map(m => ({ id: `meeting-${m.id}`, date: m.starts_at, title: m.topic, detail: m.trainer_name, kind: "Meeting" })),
    ...(events.data ?? []).map(e => ({ id: `event-${e.id}`, date: e.starts_at, title: e.title, detail: e.location, kind: "Event" })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  return {
    rows, name: profile.data?.full_name, organisation: orgProfile.data?.full_name ?? orgProfile.data?.email,
    certificates: certificates.count ?? 0, meetings: meetings.data ?? [], bookings: bookings.data ?? [],
    sessions: sessions.data ?? [], events: events.data ?? [], tasks: tasks.data ?? [], assignments: assignments.data ?? [],
    submissions: submissions.data ?? [], quizzes: quizzes.data ?? [], attempts: attempts.data ?? [],
    notices: (notices.data ?? []).filter(n => !n.ends_on || n.ends_on >= now.slice(0, 10)),
    courseNotices: courseNotices.data ?? [], lessons: lessons.data ?? [], progress: progress.data ?? [], agenda,
    instalments: instalments.data ?? [],
    credit: credit.data?.balance ?? null,
  };
}

function Agenda({ items }: { items: AgendaItem[] }) {
  return items.length ? <ul className="divide-y divide-border">{items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
    <div className="min-w-0"><span className="text-xs font-semibold uppercase text-muted-foreground">{item.kind} · {dateText(item.date)}</span><p className="font-medium text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div>
    {item.slug && <Button asChild variant="ghost" size="icon" title={`Open ${item.title}`}><Link to="/learn/$slug" params={{ slug: item.slug }} {...(item.target ? { hash: item.target } : {})} aria-label={`Open ${item.title}`}><ArrowRight className="size-4" /></Link></Button>}
  </li>)}</ul> : <p className="py-4 text-sm text-muted-foreground">Nothing scheduled yet.</p>;
}

export function StudentHome({ userId, email }: { userId: string; email: string }) {
  const navigate = useWorkspaceNavigate();
  const { data, isPending, error } = useQuery({ queryKey: ["student-home", userId, email], queryFn: () => loadStudentHome(userId, email) });
  if (isPending) return <div className="mt-7 space-y-5"><Skeleton className="h-40 w-full" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></div></div>;
  if (error || !data) return <p className="mt-8 text-sm text-destructive">Your learning overview could not be loaded. Please refresh and try again.</p>;
  const enrolled = data.rows.filter(r => r.status !== "withdrawn");
  const now = Date.now();
  const pending = data.assignments.filter(a => !data.submissions.some(s => s.assignment_id === a.id));
  const overdue = pending.filter(a => a.due_at && new Date(a.due_at).getTime() < now);
  const dueSoon = pending.filter(a => a.due_at && new Date(a.due_at).getTime() >= now).sort((a,b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""));
  const nextClass = data.sessions.find(s => data.bookings.some(b => b.session_id === s.id && b.status === "confirmed"));
  const recentNotices = data.courseNotices.slice(0, 3);
  return <div className="mt-5 space-y-9">
    <header className="border-b border-border pb-6"><p className="text-xs font-semibold uppercase text-brand-gold">Your learning</p><h2 className="mt-2 font-serif text-3xl text-primary sm:text-4xl">Welcome back{data.name?.split(" ")[0] ? `, ${data.name.split(" ")[0]}` : ""}</h2>{data.organisation && <p className="mt-1 text-sm text-muted-foreground">Learning with {data.organisation}</p>}</header>
    <section aria-label="Your next steps"><div className="flex flex-wrap items-end justify-between gap-2"><h3 className="font-serif text-2xl text-primary">Your next steps</h3><span className="text-xs text-muted-foreground">Across your classes</span></div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="border-t-2 border-destructive pt-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Overdue</p><p className="mt-2 font-serif text-3xl text-primary">{overdue.length}</p>{overdue[0] ? <Button asChild variant="link" className="h-auto max-w-full justify-start px-0 text-left whitespace-normal"><Link to="/learn/$slug" params={{ slug: overdue[0].course_slug }} hash={`#assignment-${overdue[0].id}`}>{overdue[0].title} <ArrowRight className="size-4 shrink-0" /></Link></Button> : <p className="mt-2 text-sm text-muted-foreground">Nothing overdue</p>}</div>
        <div className="border-t-2 border-brand-gold pt-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Due next</p>{dueSoon[0] ? <><p className="mt-2 font-medium">{dueSoon[0].title}</p><p className="mt-1 text-sm text-muted-foreground">{courseName(dueSoon[0].course_slug)} · {dateText(dueSoon[0].due_at as string)}</p><Button asChild variant="link" className="h-auto px-0"><Link to="/learn/$slug" params={{ slug: dueSoon[0].course_slug }} hash={`#assignment-${dueSoon[0].id}`}>Open assignment <ArrowRight className="size-4" /></Link></Button></> : <p className="mt-2 text-sm text-muted-foreground">No work due soon</p>}</div>
        <div className="border-t-2 border-primary pt-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Next confirmed class</p>{nextClass ? <><p className="mt-2 font-medium">{nextClass.title}</p><p className="mt-1 text-sm text-muted-foreground">{dateText(nextClass.starts_at)}</p><Button asChild variant="link" className="h-auto px-0"><Link to="/learn/$slug" params={{ slug: nextClass.course_slug }} hash="#live-classes">Class details <ArrowRight className="size-4" /></Link></Button></> : <p className="mt-2 text-sm text-muted-foreground">No class booked yet</p>}</div>
      </div>
    </section>
    <section className="border-t border-border pt-6"><div className="flex items-center justify-between gap-3"><h3 className="font-serif text-2xl text-primary">My courses</h3><Button variant="link" onClick={() => navigate?.("courses")}>All courses <ArrowRight className="size-4" /></Button></div>
      {enrolled.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{enrolled.slice(0, 4).map(row => { const image = courses.find(c => c.slug === row.course_slug)?.image; const next = dueSoon.find(a => a.course_slug === row.course_slug) ?? overdue.find(a => a.course_slug === row.course_slug); return <article key={row.id} className="flex min-w-0 overflow-hidden rounded-md border border-border bg-card"><div className="hidden w-28 shrink-0 bg-secondary sm:block">{image && <img src={image} alt="" className="h-full w-full object-cover" />}</div><div className="flex min-w-0 flex-1 flex-col p-4"><p className="font-serif text-xl leading-tight text-primary">{courseName(row.course_slug)}</p><p className="mt-2 text-xs text-muted-foreground">{row.progress}% complete{next ? ` · Next: ${next.title}` : " · No work due soon"}</p><div className="mt-2 h-1.5 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }} /></div><Button asChild variant="link" className="mt-auto h-auto self-start px-0 pt-3"><Link to="/learn/$slug" params={{ slug: row.course_slug }}>Open class <ArrowRight className="size-4" /></Link></Button></div></article>; })}</div> : <div className="mt-4"><p className="text-sm text-muted-foreground">No course is linked to your account yet.</p><Button asChild className="mt-4"><Link to="/courses">Explore courses <ArrowRight className="size-4" /></Link></Button></div>}
    </section>
    <div className="grid gap-8 border-t border-border pt-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]">
      <div className="space-y-8"><section><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><ClipboardList className="size-5 text-brand-gold" /> Coming up</h3><div className="mt-2"><Agenda items={data.agenda.slice(0, 5)} /></div></section>
        <section className="border-t border-border pt-6"><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Megaphone className="size-5 text-brand-gold" /> Class announcements</h3>{recentNotices.length ? <ul className="mt-2 divide-y divide-border">{recentNotices.map(n => <li key={n.id} className="py-3"><p className="text-xs text-muted-foreground">{courseName(n.course_slug)} · {dateText(n.created_at)}</p><div className="mt-1 line-clamp-3 text-sm"><NoticeBody text={n.body || n.title} /></div><Button asChild variant="link" className="h-auto px-0"><Link to="/learn/$slug" params={{ slug: n.course_slug }} hash="#stream">Open Stream <ArrowRight className="size-4" /></Link></Button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No class announcements yet.</p>}</section>
      </div>
      <aside className="space-y-7"><section><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><CalendarDays className="size-5 text-brand-gold" /> Schedule</h3><p className="mt-2 text-sm text-muted-foreground">Confirmed classes, meetings and deadlines appear in your upcoming list.</p></section>
        <section className="border-t border-border pt-5"><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Video className="size-5 text-brand-gold" /> Live sessions</h3><p className="mt-2 text-sm text-muted-foreground">{nextClass ? `${nextClass.title} · ${dateText(nextClass.starts_at)}` : "No confirmed live session yet."}</p></section>
        {data.instalments.length > 0 && <section className="border-t border-border pt-5"><h3 className="font-serif text-2xl text-primary">Payments</h3><p className="mt-2 text-sm text-muted-foreground">{data.instalments.length} unpaid instalment{data.instalments.length === 1 ? "" : "s"} recorded.</p><Button variant="link" className="px-0" onClick={() => navigate?.("pay")}>View payments <ArrowRight className="size-4" /></Button></section>}
      </aside>
    </div>
  </div>;
}
