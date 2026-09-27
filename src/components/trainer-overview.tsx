import { PendingSeatRequests, SessionRequests } from "@/components/session-bookings";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, X, BookOpen, Users, CalendarDays, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { fmtDateTime, safeHref, type Lesson, type LiveSession } from "@/lib/learning";

const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
type Roster = { enrollment_id: string; course_slug: string; student_name: string; student_email: string; progress: number; status: string; start_date: string | null; end_date: string | null; lessons_done: number };
type MeetingSlot = { id: string; topic: string; starts_at: string; duration_min: number; booked_by: string | null; booked_name: string | null; meeting_url: string | null };
type CalendarItem = { kind: "class"; data: LiveSession } | { kind: "slot"; data: MeetingSlot };

export function useTrainerCourses(userId: string) {
  return useQuery({ queryKey: ["t-courses", userId], queryFn: async () => ((await supabase.from("trainer_courses").select("course_slug").eq("trainer_id", userId)).data ?? []).map(r => r.course_slug as string) });
}
function useRoster(userId: string) {
  return useQuery({ queryKey: ["t-roster", userId], queryFn: async () => ((await supabase.rpc("trainer_roster" as never)).data ?? []) as unknown as Roster[] });
}
function useSessions(userId: string) {
  return useQuery({ queryKey: ["t-live", userId], queryFn: async () => ((await supabase.from("live_sessions").select("*").eq("trainer_id", userId).order("starts_at")).data ?? []) as LiveSession[] });
}

/* ---------- Overview + My courses ---------- */
export function TrainerOverview({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: mine = [] } = useTrainerCourses(userId);
  const { data: roster = [] } = useRoster(userId);
  const { data: sessions = [] } = useSessions(userId);
  const [pick, setPick] = useState("");
  const next = sessions.filter(s => s.status !== "cancelled" && new Date(s.starts_at).getTime() > Date.now());
  const add = async () => {
    if (!pick) return;
    const { error } = await supabase.from("trainer_courses").insert({ trainer_id: userId, course_slug: pick });
    if (error) return void toast.error(error.message.includes("duplicate") ? "Already in your list." : error.message);
    setPick(""); void qc.invalidateQueries({ queryKey: ["t-courses", userId] }); void qc.invalidateQueries({ queryKey: ["t-roster", userId] });
  };
  const remove = async (slug: string) => {
    await supabase.from("trainer_courses").delete().eq("trainer_id", userId).eq("course_slug", slug);
    void qc.invalidateQueries({ queryKey: ["t-courses", userId] }); void qc.invalidateQueries({ queryKey: ["t-roster", userId] });
  };
  const stats = [
    { Icon: BookOpen, label: "Courses I teach", value: mine.length },
    { Icon: Users, label: "Enrolled students", value: roster.length },
    { Icon: CalendarDays, label: "Upcoming sessions", value: next.length },
    { Icon: CheckCircle2, label: "Avg. progress", value: roster.length ? `${Math.round(roster.reduce((a, r) => a + r.progress, 0) / roster.length)}%` : "—" },
  ];
  return (
    <div className="mt-6 space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(({ Icon, label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-5"><Icon className="size-5 text-brand-gold" /><p className="mt-3 font-serif text-4xl text-primary">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
      ))}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <h2 className="font-serif text-2xl text-primary">My courses</h2>
          {mine.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Add the courses you teach to see their students here.</p>}
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">{mine.map(slug => {
            const n = roster.filter(r => r.course_slug === slug).length;
            return (
              <li key={slug} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2"><Link to="/courses/$slug" params={{ slug }} className="font-medium hover:underline">{courseName(slug)}</Link><button onClick={() => void remove(slug)} aria-label="Remove course"><X className="size-4 text-muted-foreground" /></button></div>
                <p className="mt-1 text-sm text-muted-foreground">{n} student{n === 1 ? "" : "s"} · {next.filter(s => s.course_slug === slug).length} upcoming</p>
              </li>
            );
          })}</ul>
          <div className="mt-4 flex gap-2"><select className={sel} value={pick} onChange={e => setPick(e.target.value)}><option value="">Add a course I teach…</option>{courses.filter(c => !mine.includes(c.slug)).map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select><Button className="rounded-full" onClick={() => void add()}>Add</Button></div>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-primary">Next sessions</h2>
          {next.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled. Use the Calendar tab.</p> : (
            <ul className="mt-3 space-y-2">{next.slice(0, 5).map(s => (
              <li key={s.id} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">{s.title}</p><p className="text-muted-foreground">{fmtDateTime(s.starts_at)} · {courseName(s.course_slug)}</p>
                {s.meeting_url && <a href={s.meeting_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs underline"><ExternalLink className="size-3" />Start & host</a>}</li>
            ))}</ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* ---------- Enrolled students ---------- */
export function TrainerStudents({ userId }: { userId: string }) {
  const { data: roster = [], isLoading } = useRoster(userId);
  const { data: mine = [] } = useTrainerCourses(userId);
  const [course, setCourse] = useState("all");
  const [q, setQ] = useState("");
  const shown = roster.filter(r => (course === "all" || r.course_slug === course) && (!q || `${r.student_name} ${r.student_email}`.toLowerCase().includes(q.toLowerCase())));
  if (isLoading) return <p className="mt-6 text-muted-foreground">Loading…</p>;
  if (!mine.length) return <p className="mt-6 text-muted-foreground">Add the courses you teach on the Overview tab first.</p>;
  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3"><select className={`${sel} max-w-sm`} value={course} onChange={e => setCourse(e.target.value)}><option value="all">All my courses</option>{mine.map(s => <option key={s} value={s}>{courseName(s)}</option>)}</select><Input className="max-w-xs" placeholder="Search name or email" value={q} onChange={e => setQ(e.target.value)} /></div>
      {shown.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">No enrolled students yet. Staff enrol students from the Staff admin page.</p> : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>{["Student", "Course", "Progress", "Lessons done", "Dates", "Status"].map(h => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>{shown.map(r => (
            <tr key={r.enrollment_id} className="border-t border-border">
              <td className="px-3 py-2">{r.student_name}<div><a className="text-xs underline" href={`mailto:${r.student_email}`}>{r.student_email}</a></div></td>
              <td className="px-3 py-2">{courseName(r.course_slug)}</td>
              <td className="px-3 py-2"><div className="h-2 w-24 rounded-full bg-muted"><div className="h-2 rounded-full bg-brand-gold" style={{ width: `${r.progress}%` }} /></div><span className="text-xs">{r.progress}%</span></td>
              <td className="px-3 py-2">{r.lessons_done}</td>
              <td className="px-3 py-2 text-xs">{r.start_date ?? "—"} → {r.end_date ?? "—"}</td>
              <td className="px-3 py-2 capitalize">{r.status}</td>
            </tr>))}</tbody>
        </table></div>
      )}
    </div>
  );
}

/* ---------- Lesson history ---------- */
export function TrainerLessonHistory({ userId }: { userId: string }) {
  const { data: lessons = [] } = useQuery({ queryKey: ["t-lesson-history", userId], queryFn: async () => ((await supabase.from("lessons").select("*").eq("created_by", userId).order("created_at", { ascending: false })).data ?? []) as Lesson[] });
  const { data: stats = [] } = useQuery({ queryKey: ["t-lesson-stats", userId], queryFn: async () => ((await supabase.rpc("trainer_lesson_stats" as never)).data ?? []) as unknown as { lesson_id: string; completions: number }[] });
  const { data: sessions = [] } = useSessions(userId);
  const past = sessions.filter(s => new Date(s.starts_at).getTime() < Date.now()).reverse();
  const done = (id: string) => stats.find(s => s.lesson_id === id)?.completions ?? 0;
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="font-serif text-2xl text-primary">Lessons I've published</h2>
        {lessons.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No lessons yet. Add one in the Lessons tab.</p> : (
          <ul className="mt-3 space-y-2">{lessons.map(l => (
            <li key={l.id} className="rounded-md border border-border p-3 text-sm"><div className="flex justify-between gap-3"><p className="font-medium">{l.title}</p><span className="shrink-0 text-xs text-muted-foreground">{done(l.id)} completed</span></div>
              <p className="text-xs text-muted-foreground">{courseName(l.course_slug)} · added {new Date(l.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</p></li>
          ))}</ul>
        )}
      </section>
      <section>
        <h2 className="font-serif text-2xl text-primary">Past sessions</h2>
        {past.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No past sessions yet.</p> : (
          <ul className="mt-3 space-y-2">{past.map(s => <li key={s.id} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{courseName(s.course_slug)} · {fmtDateTime(s.starts_at)} · {s.duration_min} min · <span className="capitalize">{s.status === "cancelled" ? "cancelled" : "held"}</span></p></li>)}</ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Calendar ---------- */
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function TrainerCalendar({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: sessions = [] } = useSessions(userId);
  const { data: slots = [] } = useQuery({ queryKey: ["t-slots", userId], queryFn: async () => {
    const { data, error } = await supabase.from("meeting_slots").select("id,topic,starts_at,duration_min,booked_by,booked_name,meeting_url").eq("trainer_id", userId).order("starts_at");
    if (error) throw error;
    return data as MeetingSlot[];
  } });
  const { data: mine = [] } = useTrainerCourses(userId);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [day, setDay] = useState<string | null>(null);
  const [f, setF] = useState({ slug: "", title: "", time: "10:00", duration_min: "60", meeting_url: "" });
  const byDay = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    const add = (startsAt: string, item: CalendarItem) => {
      const k = dayKey(new Date(startsAt));
      m.set(k, [...(m.get(k) ?? []), item]);
    };
    sessions.filter(s => s.status !== "cancelled").forEach(s => add(s.starts_at, { kind: "class", data: s }));
    slots.forEach(s => add(s.starts_at, { kind: "slot", data: s }));
    for (const [k, items] of m) m.set(k, [...items].sort((a, b) => a.data.starts_at.localeCompare(b.data.starts_at)));
    return m;
  }, [sessions, slots]);
  const first = (month.getDay() + 6) % 7; const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  const today = dayKey(new Date());
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["t-live", userId] }); void qc.invalidateQueries({ queryKey: ["live-classes"] }); };
  const add = async () => {
    const slug = f.slug || mine[0] || courses[0]!.slug;
    if (!day || !f.title.trim()) return void toast.error("Add a title.");
    const starts = new Date(`${day}T${f.time}`);
    if (starts.getTime() < Date.now()) return void toast.error("Pick a time in the future.");
    const { error } = await supabase.from("live_sessions").insert({ course_slug: slug, trainer_id: userId, title: f.title.trim(), starts_at: starts.toISOString(), duration_min: Math.min(480, Math.max(15, Number(f.duration_min) || 60)), meeting_url: f.meeting_url.trim() ? safeHref(f.meeting_url.trim()) : null });
    if (error) return void toast.error(error.message);
    toast.success("Session scheduled"); setF({ ...f, title: "", meeting_url: "" }); refresh();
  };
  const setStatus = async (id: string, status: string) => { await supabase.from("live_sessions").update({ status }).eq("id", id); refresh(); };
  const list = day ? byDay.get(day) ?? [] : [];
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft /></Button>
          <p className="font-serif text-2xl text-primary">{month.toLocaleDateString("en-SG", { month: "long", year: "numeric" })}</p>
          <Button variant="ghost" size="icon" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => <div key={d} className="py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
           const k = dayKey(d); const items = byDay.get(k) ?? [];
          return (
             <Button key={k} variant="outline" onClick={() => setDay(k)} className={`h-auto min-h-20 min-w-0 flex-col items-stretch justify-start whitespace-normal rounded-md p-1.5 text-left text-xs shadow-none ${day === k ? "border-primary bg-secondary" : "border-border hover:bg-muted"}`}>
              <span className={`inline-flex size-6 items-center justify-center rounded-full ${k === today ? "bg-primary text-primary-foreground" : ""}`}>{d.getDate()}</span>
               {items.slice(0, 2).map(item => <span key={item.data.id} className={`mt-0.5 block w-full truncate rounded px-1 ${item.kind === "class" ? "bg-brand-gold/20" : "bg-secondary text-primary"}`}>{new Date(item.data.starts_at).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })} {item.kind === "class" ? item.data.title : `1-to-1 · ${item.data.topic}`}</span>)}
              {items.length > 2 && <p className="mt-0.5 text-muted-foreground">+{items.length - 2} more</p>}
             </Button>
          );
        })}</div>
      </div>
      <aside className="space-y-4">
        <PendingSeatRequests userId={userId} />
        {!day ? <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Click a day to see its sessions or schedule a new one.</p> : <>
          <h3 className="font-serif text-2xl text-primary">{new Date(`${day}T00:00`).toLocaleDateString("en-SG", { weekday: "long", day: "numeric", month: "long" })}</h3>
           {list.length === 0 ? <p className="text-sm text-muted-foreground">No sessions this day.</p> : <ul className="space-y-2">{list.map(item => {
             return item.kind === "class" ? <li key={item.data.id} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">{item.data.title}</p><p className="text-xs text-muted-foreground">{new Date(item.data.starts_at).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })} · {item.data.duration_min} min · {courseName(item.data.course_slug)}</p><div className="mt-1 flex gap-3 text-xs">{item.data.meeting_url && <a className="underline" href={safeHref(item.data.meeting_url)} target="_blank" rel="noreferrer">Join meeting</a>}<Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => void setStatus(item.data.id, "cancelled")}>Cancel class</Button></div><SessionRequests sessionId={item.data.id} /></li>
             : <li key={item.data.id} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">1-to-1 · {item.data.topic}</p><p className="text-xs text-muted-foreground">{new Date(item.data.starts_at).toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit" })} · {item.data.duration_min} min · {item.data.booked_by ? `Booked by ${item.data.booked_name || "student"}` : "Available"}</p><div className="mt-1 flex gap-3 text-xs">{item.data.meeting_url && <a className="underline" href={safeHref(item.data.meeting_url)} target="_blank" rel="noreferrer">Join meeting</a>}{!item.data.booked_by && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={async () => { const { error } = await supabase.from("meeting_slots").delete().eq("id", item.data.id).eq("trainer_id", userId); if (error) toast.error(error.message); else void qc.invalidateQueries({ queryKey: ["t-slots", userId] }); }}>Remove slot</Button>}</div></li>;
           })}</ul>}
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">Schedule on this day</p>
            <select className={sel} value={f.slug || mine[0] || courses[0]!.slug} onChange={e => setF({ ...f, slug: e.target.value })}>{(mine.length ? courses.filter(c => mine.includes(c.slug)) : courses).map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
            <Input placeholder="Session title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-2"><Input type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} /><Input type="number" min={15} max={480} value={f.duration_min} onChange={e => setF({ ...f, duration_min: e.target.value })} aria-label="Minutes" /></div>
            <Input placeholder="Zoom or Whereby link" value={f.meeting_url} onChange={e => setF({ ...f, meeting_url: e.target.value })} />
            <Button className="w-full rounded-full" onClick={() => void add()}>Schedule</Button>
          </div>
        </>}
      </aside>
    </div>
  );
}
