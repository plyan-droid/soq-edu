import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, GraduationCap, Megaphone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { useWorkspaceNavigate } from "@/components/workspace-shell";

const courseName = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const dateText = (value: string) => new Date(value).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
type AgendaItem = { id: string; date: string; title: string; detail: string; kind: string; slug?: string };

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
    ...(assignments.data ?? []).filter(a => a.due_at && a.due_at >= now && !(submissions.data ?? []).some(s => s.assignment_id === a.id)).map(a => ({ id: `assignment-${a.id}`, date: a.due_at as string, title: a.title, detail: courseName(a.course_slug), kind: "Assignment", slug: a.course_slug })),
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
    {item.slug && <Button asChild variant="ghost" size="icon" title={`Open ${item.title}`}><Link to="/learn/$slug" params={{ slug: item.slug }} aria-label={`Open ${item.title}`}><ArrowRight className="size-4" /></Link></Button>}
  </li>)}</ul> : <p className="py-4 text-sm text-muted-foreground">Nothing scheduled yet.</p>;
}

export function StudentHome({ userId, email }: { userId: string; email: string }) {
  const navigate = useWorkspaceNavigate();
  const [monthOffset, setMonthOffset] = useState(0);
  const { data, isPending, error } = useQuery({ queryKey: ["student-home", userId, email], queryFn: () => loadStudentHome(userId, email) });
  if (isPending) return <div className="mt-7 space-y-5"><Skeleton className="h-48 w-full" /><div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-60" /><Skeleton className="h-60" /></div></div>;
  if (error || !data) return <p className="mt-8 text-sm text-destructive">Your learning overview could not be loaded. Please refresh and try again.</p>;
  const current = data.rows.find(r => r.status === "active") ?? data.rows.find(r => r.status !== "completed") ?? data.rows[0];
  const firstName = data.name?.split(" ")[0];
  const lessonIds = new Set(data.lessons.map(l => l.id));
  const completedLessons = data.progress.filter(p => lessonIds.has(p.lesson_id)).length;
  const enrolled = data.rows.filter(r => r.status !== "withdrawn");
  const upcoming = data.agenda.slice(0, 5);
  const month = new Date(); month.setDate(1); month.setMonth(month.getMonth() + monthOffset);
  const year = month.getFullYear(), monthNumber = month.getMonth();
  const startDay = (new Date(year, monthNumber, 1).getDay() + 6) % 7;
  const days = new Date(year, monthNumber + 1, 0).getDate();
  const daysWithActivity = new Set(data.agenda.map(a => a.date.slice(0, 10)));
  const section = "border-t border-border pt-6";
  return <div className="mt-5 space-y-8">
    <header className="border-b border-border pb-7">
      <p className="text-xs font-semibold uppercase text-brand-gold">Your learning</p>
      <h2 className="mt-2 font-serif text-3xl text-primary sm:text-4xl">Welcome back{firstName ? `, ${firstName}` : ""}</h2>
      {data.organisation && <p className="mt-1 text-sm text-muted-foreground">Learning with {data.organisation}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">{[
        ["Courses", enrolled.length], ["Certificates", data.certificates], ["Quizzes passed", data.attempts.filter(a => a.passed).length], ["Upcoming meetings", data.meetings.length],
      ].map(([label, value]) => <div key={label} className="border-l-2 border-brand-gold pl-3"><p className="font-serif text-3xl text-primary">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
    </header>

    <section aria-label="Continue learning" className="grid gap-5 border-b border-border pb-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div><h3 className="font-serif text-2xl text-primary">Continue learning</h3>{current ? <div className="mt-4 flex gap-4">
        {courses.find(c => c.slug === current.course_slug)?.image && <img src={courses.find(c => c.slug === current.course_slug)?.image} alt="" className="hidden size-24 shrink-0 rounded-md object-cover sm:block" />}
        <div className="min-w-0 flex-1"><p className="font-semibold text-primary">{courseName(current.course_slug)}</p><p className="mt-1 text-sm text-muted-foreground">{current.progress}% complete · {current.status}</p><div className="mt-3 h-1.5 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, Math.max(0, current.progress))}%` }} /></div><Button asChild className="mt-4"><Link to="/learn/$slug" params={{ slug: current.course_slug }}>Continue course <ArrowRight className="size-4" /></Link></Button></div>
      </div> : <div className="mt-4"><p className="text-sm text-muted-foreground">No course is linked to your account yet.</p><Button asChild className="mt-4"><Link to="/courses">Explore courses <ArrowRight className="size-4" /></Link></Button></div>}</div>
      <div className="border-l-2 border-brand-gold pl-5"><h3 className="font-serif text-2xl text-primary">Learning activity</h3><p className="mt-3 text-sm text-muted-foreground">{completedLessons ? `${completedLessons} lessons marked complete across your courses.` : "No lessons completed yet."}</p><p className="mt-2 text-sm text-muted-foreground">{data.lessons.length ? `${data.lessons.length} lessons available in your enrolled courses.` : "Lessons will appear when your trainer adds them."}</p><Button variant="link" className="mt-2 px-0" onClick={() => navigate?.("courses")}>My courses <ArrowRight className="size-4" /></Button></div>
    </section>

    <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)]">
      <div className="min-w-0 space-y-8">
        <section><div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><GraduationCap className="size-5 text-brand-gold" /> Course overview</h3><Button variant="link" onClick={() => navigate?.("courses")}>All courses <ArrowRight className="size-4" /></Button></div>
          {enrolled.length ? <ul className="mt-2 divide-y divide-border">{enrolled.slice(0, 6).map(row => <li key={row.id} className="flex items-center gap-3 py-3"><img src={courses.find(c => c.slug === row.course_slug)?.image} alt="" className="size-12 shrink-0 rounded-sm object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={courseName(row.course_slug)}>{courseName(row.course_slug)}</p><div className="mt-1 h-1.5 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, Math.max(0, row.progress))}%` }} /></div></div><span className="text-xs tabular-nums text-muted-foreground">{row.progress}%</span><Button asChild variant="ghost" size="icon"><Link to="/learn/$slug" params={{ slug: row.course_slug }} aria-label={`Open ${courseName(row.course_slug)}`}><ArrowRight className="size-4" /></Link></Button></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No enrolled courses yet.</p>}
        </section>
        <section className={section}><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><ClipboardList className="size-5 text-brand-gold" /> My assignments</h3>
          {data.assignments.length ? <ul className="mt-2 divide-y divide-border">{data.assignments.slice(0, 6).map(a => { const submission = data.submissions.find(s => s.assignment_id === a.id); return <li key={a.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{courseName(a.course_slug)} · {a.due_at ? `Due ${dateText(a.due_at)}` : "No due date"}</p></div><div className="flex shrink-0 items-center gap-2"><span className="text-xs text-muted-foreground">{submission?.status === "graded" ? `Graded ${submission.score ?? "—"}/${a.max_score}` : submission ? "Submitted" : a.due_at && a.due_at < new Date().toISOString() ? "Past due" : "To do"}</span><Button asChild variant="ghost" size="icon"><Link to="/learn/$slug" params={{ slug: a.course_slug }} aria-label={`Open assignment ${a.title}`}><ArrowRight className="size-4" /></Link></Button></div></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">No assignments set for your courses.</p>}
        </section>
        <section className={section}><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><CheckCircle2 className="size-5 text-brand-gold" /> My quizzes</h3>
          {data.quizzes.length ? <ul className="mt-2 divide-y divide-border">{data.quizzes.slice(0, 6).map(q => { const tries = data.attempts.filter(a => a.quiz_id === q.id); return <li key={q.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="text-sm font-medium">{q.title}</p><p className="text-xs text-muted-foreground">{courseName(q.course_slug)} · {tries.some(a => a.passed) ? "Passed" : tries.length ? `Best ${Math.max(...tries.map(a => a.score))}%` : "Not attempted"}</p></div><Button asChild variant="ghost" size="icon"><Link to="/learn/$slug" params={{ slug: q.course_slug }} aria-label={`Open quiz ${q.title}`}><ArrowRight className="size-4" /></Link></Button></li>; })}</ul> : <p className="mt-3 text-sm text-muted-foreground">No quizzes available for your courses.</p>}
        </section>
        <section className={section}><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Megaphone className="size-5 text-brand-gold" /> Noticeboard</h3>
          {data.courseNotices.length || data.notices.length ? <ul className="mt-2 divide-y divide-border">{[...data.courseNotices.map(n => ({ id: `course-${n.id}`, title: n.title, body: n.body, source: courseName(n.course_slug) })), ...data.notices.map(n => ({ id: `site-${n.id}`, title: n.title, body: n.body, source: "SOQ" }))].slice(0, 5).map(n => <li key={n.id} className="py-3 text-sm"><p className="font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.source}</p>{n.body && <p className="mt-1 text-muted-foreground">{n.body}</p>}</li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No announcements at the moment.</p>}
          <Button asChild variant="link" className="px-0"><Link to="/noticeboard">View noticeboard <ArrowRight className="size-4" /></Link></Button>
        </section>
      </div>
      <aside className="min-w-0 space-y-8">
        <section><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><CalendarDays className="size-5 text-brand-gold" /> Calendar</h3><div className="flex gap-1"><Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonthOffset(x => x - 1)}>‹</Button><Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonthOffset(x => x + 1)}>›</Button></div></div>
          <p className="mt-2 text-center text-sm font-semibold">{month.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p><div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="py-2 text-muted-foreground">{d}</span>)}{Array.from({ length: startDay }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const value = `${year}-${String(monthNumber + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`; const marked = daysWithActivity.has(value); return <span key={value} className={`relative grid aspect-square place-items-center rounded-sm ${marked ? "bg-brand-gold-soft font-semibold text-primary" : "text-muted-foreground"}`} title={marked ? `Activity on ${value}` : undefined}>{i + 1}{marked && <span className="absolute bottom-0.5 size-1 rounded-full bg-brand-gold" />}</span>; })}</div>
          <p className="mt-3 text-xs text-muted-foreground">Highlighted dates are your confirmed bookings, events or deadlines.</p>
        </section>
        <section className={section}><h3 className="font-serif text-2xl text-primary">Coming up</h3><Agenda items={upcoming} /></section>
        <section className={section}><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Video className="size-5 text-brand-gold" /> Live sessions & meetings</h3>
          {data.sessions.length || data.meetings.length ? <ul className="mt-2 divide-y divide-border">{data.sessions.slice(0, 3).map(s => <li key={s.id} className="py-3 text-sm"><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{dateText(s.starts_at)} · {data.bookings.find(b => b.session_id === s.id)?.status === "confirmed" ? "Confirmed" : "Awaiting trainer confirmation"}</p><Button asChild variant="link" className="h-auto px-0"><Link to="/learn/$slug" params={{ slug: s.course_slug }}>Open class <ArrowRight className="size-4" /></Link></Button></li>)}{data.meetings.slice(0, 3).map(m => <li key={m.id} className="py-3 text-sm"><p className="font-medium">{m.topic}</p><p className="text-xs text-muted-foreground">{dateText(m.starts_at)} · {m.trainer_name}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No classes or meetings booked yet.</p>}
        </section>
        <section className={section}><h3 className="font-serif text-2xl text-primary">Upcoming events</h3>{data.events.length ? <ul className="mt-2 divide-y divide-border">{data.events.slice(0, 3).map(e => <li key={e.id} className="py-3 text-sm"><p className="font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{dateText(e.starts_at)} · {e.location}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No events booked yet.</p>}<Button asChild variant="link" className="px-0"><Link to="/events">Explore events <ArrowRight className="size-4" /></Link></Button></section>
        <section className={section}><h3 className="font-serif text-2xl text-primary">SkillsFuture Credit</h3><p className="mt-2 text-sm text-muted-foreground">{data.credit === null ? "No balance added yet." : `Your self-reported balance: S$${Number(data.credit).toLocaleString("en-SG", { minimumFractionDigits: 2 })}. This is not a verified government balance.`}</p><Button variant="link" className="px-0" onClick={() => navigate?.("sfc")}>View credit & claims <ArrowRight className="size-4" /></Button></section>
        <section className={section}><h3 className="font-serif text-2xl text-primary">Payments</h3><p className="mt-2 text-sm text-muted-foreground">{data.instalments.length ? `${data.instalments.length} unpaid instalment${data.instalments.length === 1 ? "" : "s"}. Next due ${new Date(`${data.instalments[0].due_date}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}: S$${Number(data.instalments[0].amount).toLocaleString("en-SG", { minimumFractionDigits: 2 })}.` : "No unpaid instalments recorded."}</p><Button variant="link" className="px-0" onClick={() => navigate?.("pay")}>View payments <ArrowRight className="size-4" /></Button></section>
      </aside>
    </div>
  </div>;
}