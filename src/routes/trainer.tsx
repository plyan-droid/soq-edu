import { StartHere, PageSkeleton, EmptyState } from "@/components/start-here";
import { PendingSeatRequests, SessionRequests } from "@/components/session-bookings";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Home, CalendarDays, BookOpen, Users, UserRound } from "lucide-react";
import { TrainerSessionPlans } from "@/components/session-plans";
import { TutorProfileEditor } from "@/components/tutor-profile-editor";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceShell, type WorkspaceSection } from "@/components/workspace-shell";
import { TrainerQuizzes, TrainerAssignments, TrainerAttendance, TrainerNotices, TrainerStats, TrainerSlots } from "@/components/trainer-tools";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories, courses } from "@/lib/site-content";
import { CourseForm, cleanCourse, emptyCourse, type CourseFields, type Faq } from "@/components/course-form";
import type { CourseSection } from "@/lib/course-details";
import { fmtDateTime, type Lesson, type LiveSession } from "@/lib/learning";
import { TrainerOverview, TrainerStudents, TrainerLessonHistory, TrainerCalendar } from "@/components/trainer-overview";

export const Route = createFileRoute("/trainer")({
  head: () => ({
    meta: [
      { title: "Trainer Dashboard | SOQ International Academy" },
      { name: "description", content: "SOQ trainers add lessons, schedule live classes and submit new courses for approval." },
      { property: "og:title", content: "SOQ Trainer Dashboard" },
      { property: "og:description", content: "Lessons, live classes and course proposals for SOQ trainers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrainerPage,
});

const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;

function TrainerPage() {
  const { user, isTrainer, isAdmin, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (!user) return <Wrap><p className="text-muted-foreground">Please <Link to="/login" className="underline">log in</Link> first.</p></Wrap>;
  if (!isTrainer && !isAdmin) return <Wrap><p className="max-w-xl text-muted-foreground">This page is for SOQ trainers. Want to teach with us? <Link to="/teach" className="underline">Apply here</Link>. Once staff approve you, this dashboard opens.</p></Wrap>;
  return <TrainerWorkspace userId={user.id} isAdmin={isAdmin} isTrainer={isTrainer} />;
}

function TrainerWorkspace({ userId, isAdmin, isTrainer }: { userId: string; isAdmin: boolean; isTrainer: boolean }) {
  const [active, setActive] = useState("start");
  const sections: WorkspaceSection[] = [
    { name: "Home", icon: Home, items: [
      { id: "start", label: "Home", content: <StartHere role="trainer" userId={userId} onNavigate={setActive} greeting="Your teaching schedule and work needing attention." /> },
    ] },
    { name: "Classes", icon: CalendarDays, items: [
      { id: "live", label: "Live classes", content: <Live userId={userId} /> },
      { id: "calendar", label: "Calendar", content: <TrainerCalendar userId={userId} /> },
      { id: "plans", label: "Session plans", content: <TrainerSessionPlans userId={userId} /> },
      { id: "slots", label: "1-to-1 sessions", content: <TrainerSlots userId={userId} /> },
      { id: "history", label: "History", content: <TrainerLessonHistory userId={userId} /> },
    ] },
    { name: "Courses", icon: BookOpen, items: [
      { id: "overview", label: "My courses", content: <TrainerOverview userId={userId} /> },
      { id: "lessons", label: "Lessons", content: <Lessons userId={userId} isAdmin={isAdmin} /> },
      { id: "quizzes", label: "Quizzes", content: <TrainerQuizzes userId={userId} isAdmin={isAdmin} /> },
      { id: "assignments", label: "Assignments", content: <TrainerAssignments userId={userId} isAdmin={isAdmin} /> },
      { id: "notices", label: "Notices", content: <TrainerNotices userId={userId} isAdmin={isAdmin} /> },
      { id: "drafts", label: "Propose a course", content: isTrainer ? <Drafts userId={userId} /> : <p className="mt-6 text-muted-foreground">Only trainer accounts write course proposals. Review them on the Staff admin page.</p> },
    ] },
    { name: "Students", icon: Users, items: [
      { id: "students", label: "Progress", content: <TrainerStudents userId={userId} /> },
      { id: "attendance", label: "Attendance", content: <TrainerAttendance userId={userId} /> },
      { id: "stats", label: "Stats", content: <TrainerStats userId={userId} /> },
    ] },
    { name: "Profile", icon: UserRound, items: [
      { id: "profile", label: "Public profile", content: <TutorProfileEditor /> },
    ] },
  ];
  return <div className="trainer-workspace"><WorkspaceShell title="Trainer Dashboard" sections={sections} active={active} onChange={setActive} /></div>;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8"><p className="font-script text-3xl text-brand-gold">For trainers</p><h1 className="mb-8 font-serif text-5xl text-primary">Trainer dashboard</h1>{children}</div>;
}

function CoursePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <select className={sel} value={value} onChange={e => onChange(e.target.value)}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>;
}

function Lessons({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [slug, setSlug] = useState(courses[0]!.slug);
  const [f, setF] = useState({ title: "", body: "", video_url: "", file_url: "", unlock_at: "" });
  const { data = [] } = useQuery({ queryKey: ["t-lessons", slug], queryFn: async () => ((await supabase.from("lessons").select("*").eq("course_slug", slug).order("position").order("created_at")).data ?? []) as Lesson[] });
  const add = async () => {
    if (f.title.trim().length < 3) return void toast.error("Give the lesson a title.");
    const { error } = await supabase.from("lessons").insert({ course_slug: slug, position: data.length + 1, title: f.title.trim(), body: f.body || null, video_url: f.video_url || null, file_url: f.file_url || null, unlock_at: f.unlock_at ? new Date(f.unlock_at).toISOString() : null, created_by: userId });
    if (error) return void toast.error(error.message);
    setF({ title: "", body: "", video_url: "", file_url: "", unlock_at: "" }); toast.success("Lesson added");
    void qc.invalidateQueries({ queryKey: ["t-lessons", slug] });
  };
  const del = async (id: string) => { if (!confirm("Delete this lesson?")) return; await supabase.from("lessons").delete().eq("id", id); void qc.invalidateQueries({ queryKey: ["t-lessons", slug] }); };
  return (
    <div className="mt-6 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3 self-start rounded-md border border-border bg-card p-4 sm:p-5">
        <h2 className="font-serif text-lg font-semibold text-primary">New lesson</h2>
        <label className="text-sm font-medium">Course</label><CoursePicker value={slug} onChange={setSlug} />
        <Input placeholder="Lesson title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <Textarea placeholder="Lesson notes" rows={5} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} />
        <Input placeholder="Video link (YouTube or Vimeo)" value={f.video_url} onChange={e => setF({ ...f, video_url: e.target.value })} />
        <Input placeholder="Materials link (Google Drive, PDF…)" value={f.file_url} onChange={e => setF({ ...f, file_url: e.target.value })} />
        <label className="block text-sm">Unlock on (optional — leave empty to open straight away)<Input type="datetime-local" value={f.unlock_at} onChange={e => setF({ ...f, unlock_at: e.target.value })} /></label>
        <Button onClick={() => void add()}>Add lesson</Button>
        <p className="text-xs text-muted-foreground">Only students enrolled in this course can open its lessons.</p>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-primary">{courseName(slug)}</h2>
        {data.length === 0 ? <EmptyState text="No lessons for this course yet. Add a title and notes on the left to create the first one." /> : (
          <ol className="mt-3 space-y-2">{data.map((l, i) => (
            <li key={l.id} className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm"><span>{i + 1}. {l.title}{l.video_url && " · video"}{l.unlock_at && ` · opens ${new Date(l.unlock_at).toLocaleDateString("en-SG")}`}{l.file_url && " · file"}</span>
              {(l.created_by === userId || isAdmin) && <Button variant="ghost" size="icon" onClick={() => void del(l.id)} aria-label={`Delete ${l.title}`}><Trash2 className="size-4 text-muted-foreground" /></Button>}</li>))}</ol>
        )}
      </div>
    </div>
  );
}

function Live({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ slug: courses[0]!.slug, title: "", starts_at: "", duration_min: "60", meeting_url: "" });
  const { data = [] } = useQuery({ queryKey: ["t-live", userId], queryFn: async () => ((await supabase.from("live_sessions").select("*").eq("trainer_id", userId).order("starts_at")).data ?? []) as LiveSession[] });
  const add = async () => {
    if (!f.title.trim() || !f.starts_at) return void toast.error("Add a title and start time.");
    const { error } = await supabase.from("live_sessions").insert({ course_slug: f.slug, trainer_id: userId, title: f.title.trim(), starts_at: new Date(f.starts_at).toISOString(), duration_min: Number(f.duration_min) || 60, meeting_url: f.meeting_url || null });
    if (error) return void toast.error(error.message);
    toast.success("Live class scheduled"); setF({ ...f, title: "", starts_at: "", meeting_url: "" });
    void qc.invalidateQueries({ queryKey: ["t-live", userId] });
  };
  const setStatus = async (id: string, status: string) => { await supabase.from("live_sessions").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["t-live", userId] }); };
  return (
    <div className="mt-6 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="space-y-3 self-start rounded-md border border-border bg-card p-4 sm:p-5">
        <h2 className="font-serif text-lg font-semibold text-primary">Schedule a class</h2>
        <CoursePicker value={f.slug} onChange={slug => setF({ ...f, slug })} />
        <Input placeholder="Class title, e.g. Q&A: colour theory" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <div className="grid grid-cols-2 gap-3"><Input type="datetime-local" value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} /><Input type="number" min={15} placeholder="Minutes" value={f.duration_min} onChange={e => setF({ ...f, duration_min: e.target.value })} /></div>
        <Input placeholder="Meeting link (Zoom, Google Meet, Teams)" value={f.meeting_url} onChange={e => setF({ ...f, meeting_url: e.target.value })} />
        <Button onClick={() => void add()}>Schedule class</Button>
      </div>
      <div className="min-w-0 space-y-4"><PendingSeatRequests userId={userId} /><section><h2 className="font-serif text-lg font-semibold text-primary">Scheduled classes</h2><ul className="mt-2 divide-y divide-border border-t border-border">{data.length === 0 ? <EmptyState text="No live classes yet. Schedule your first one so students can request a seat." /> : data.map(s => (
        <li key={s.id} className="py-3 text-sm"><p className="font-medium">{s.title} <span className="text-xs capitalize text-muted-foreground">({s.status})</span></p><p className="text-muted-foreground">{courseName(s.course_slug)} · {fmtDateTime(s.starts_at)} · {s.duration_min} min</p>
          {s.status !== "cancelled" && <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => void setStatus(s.id, "cancelled")}>Cancel class</Button>}{s.status !== "cancelled" && <SessionRequests sessionId={s.id} />}</li>))}</ul></section></div>
    </div>
  );
}

type Draft = { id: string; title: string; category: string; summary: string; duration: string | null; mode: string | null; price: string | null; outcomes: string[]; status: string; staff_note: string | null;
  badge: string | null; level: string | null; requirements: string | null; sections: CourseSection[] | null; faqs: Faq[] | null; image_key: string | null; intake_start: string | null; intake_apply_by: string | null; intake_time: string | null; published_slug: string | null };
const draftToFields = (d: Draft): CourseFields => ({ ...emptyCourse(), title: d.title, category: d.category, summary: d.summary, price: d.price ?? "", duration: d.duration ?? "", mode: d.mode ?? "", badge: d.badge ?? "", level: d.level ?? "",
  requirements: d.requirements ?? "", outcomes: d.outcomes.join("\n"), sections: d.sections?.length ? d.sections : emptyCourse().sections, faqs: d.faqs ?? [], image_key: d.image_key ?? "",
  intake_start: d.intake_start ?? "", intake_apply_by: d.intake_apply_by ?? "", intake_time: d.intake_time ?? "" });
function Drafts({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [f, setF] = useState<CourseFields>(emptyCourse);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { data = [] } = useQuery({ queryKey: ["t-drafts", userId], queryFn: async () => ((await supabase.from("course_drafts").select("*").eq("trainer_id", userId).order("created_at", { ascending: false })).data ?? []) as unknown as Draft[] });
  const save = async (status: "draft" | "submitted") => {
    const c = cleanCourse(f);
    if (c.error) return void toast.error(c.error);
    const row = { title: f.title.trim(), category: f.category, summary: f.summary.trim(), duration: f.duration.trim() || null, mode: f.mode.trim() || null, price: f.price.trim() || null,
      badge: f.badge.trim() || null, level: f.level.trim() || null, requirements: f.requirements.trim() || null, outcomes: c.outcomes, sections: c.sections, faqs: c.faqs, image_key: f.image_key || null,
      intake_start: f.intake_start || null, intake_apply_by: f.intake_apply_by || null, intake_time: f.intake_time.trim() || null, status };
    const { error } = editing ? await supabase.from("course_drafts").update(row).eq("id", editing) : await supabase.from("course_drafts").insert({ ...row, trainer_id: userId });
    if (error) return void toast.error(error.message);
    toast.success(status === "submitted" ? "Sent to SOQ staff for approval" : "Draft saved"); setF(emptyCourse()); setEditing(null); setOpen(false);
    void qc.invalidateQueries({ queryKey: ["t-drafts", userId] });
  };
  const edit = (d: Draft) => { setF(draftToFields(d)); setEditing(d.id); setOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <div className="mt-6 grid gap-6">
      {!open ? <div><Button className="rounded-full" onClick={() => { setF(emptyCourse()); setEditing(null); setOpen(true); }}><Plus className="size-4" /> Add course</Button>
        <p className="mt-2 text-sm text-muted-foreground">Fill in the full course page. SOQ staff review it and publish it to the website.</p></div> : <>
        <h3 className="font-serif text-2xl text-primary">{editing ? "Edit course proposal" : "New course proposal"}</h3>
        <CourseForm value={f} onChange={setF} />
        <div className="flex flex-wrap gap-3"><Button variant="outline" className="rounded-full" onClick={() => void save("draft")}>Save draft</Button><Button className="rounded-full" onClick={() => void save("submitted")}>Submit for approval</Button><Button variant="ghost" className="rounded-full" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button></div>
      </>}
      <ul className="space-y-2">{data.length === 0 ? <p className="text-sm text-muted-foreground">No proposals yet.</p> : data.map(d => (
        <li key={d.id} className="rounded-md border border-border p-3 text-sm"><p className="font-medium">{d.title}</p><p className="text-xs capitalize text-muted-foreground">{d.category} · {d.status === "submitted" ? "waiting for staff" : d.status === "approved" ? "published" : d.status}</p>
          {d.staff_note && <p className="mt-1 text-xs">Staff note: {d.staff_note}</p>}
          {d.published_slug && <Link to="/courses/$slug" params={{ slug: d.published_slug }} className="mt-1 inline-block text-xs underline">View live course page</Link>}
          {d.status !== "approved" && <button className="mt-1 ml-3 text-xs underline" onClick={() => edit(d)}>{d.status === "rejected" ? "Edit & resubmit" : "Edit"}</button>}</li>))}</ul>
    </div>
  );
}
