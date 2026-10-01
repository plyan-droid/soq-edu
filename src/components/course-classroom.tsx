import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, ClipboardCheck, HelpCircle, MapPin, Video, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { fmtDateTime, type Lesson } from "@/lib/learning";
import { useTrainerCourses } from "@/components/trainer-overview";
import { noticeColor } from "@/components/trainer-tools";
import { NoticeFileList, PendingFiles, asFiles, uploadNoticeFiles, removeNoticeFiles, type NoticeFile } from "@/components/notice-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
const safe = (u: string) => (u.startsWith("http") ? u : `https://${u}`);
export const modeLabel: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };

type Tab = "stream" | "classwork" | "people" | "grades";
type Sub = { id: string; assignment_id: string; body: string; link: string | null; score: number | null; feedback: string | null; status: string; student_name: string; created_at: string };
type Asg = { id: string; title: string; instructions: string | null; due_at: string | null; max_score: number; assignment_submissions: Sub[] };
type Quiz = { id: string; title: string; pass_mark: number; gives_certificate: boolean; quiz_questions: { id: string; prompt: string; options: string[]; position: number; kind: string }[]; quiz_attempts: { score: number; passed: boolean }[] };
type Session = { id: string; title: string; starts_at: string; duration_min: number; meeting_url: string | null; status: string; mode?: string; location?: string | null };
type Drawer = { kind: "lesson"; item: Lesson } | { kind: "quiz"; item: Quiz } | { kind: "asg"; item: Asg } | null;

export function CourseClassroom({ userId, isAdmin, onNavigate }: { userId: string; isAdmin: boolean; onNavigate: (tool: string) => void }) {
  const { data: mine = [], isLoading } = useTrainerCourses(userId);
  const list = isAdmin ? courses.map(c => c.slug) : mine;
  const [picked, setPicked] = useState("");
  const slug = list.includes(picked) ? picked : list[0] ?? "";
  const [tab, setTab] = useState<Tab>("stream");
  if (isLoading) return <p className="mt-6 text-sm text-muted-foreground">Loading your courses…</p>;
  if (!slug) return <p className="mt-6 text-sm text-muted-foreground">Add your courses in My courses first.</p>;
  return (
    <div className="mt-6 max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1"><label className="text-xs font-medium text-muted-foreground">Course</label>
          <select className={`${sel} mt-1 max-w-xl`} value={slug} onChange={e => setPicked(e.target.value)}>{list.map(s => <option key={s} value={s}>{courseName(s)}</option>)}</select></div>
        <Link to="/learn/$slug" params={{ slug }} target="_blank" className="inline-flex items-center gap-1 text-sm text-primary underline">Student view <ExternalLink className="size-3" /></Link>
      </div>
      <div role="tablist" className="mt-5 flex gap-1 border-b border-border">
        {(["stream", "classwork", "people", "grades"] as Tab[]).map(t => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2 text-sm capitalize ${tab === t ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{t}</button>
        ))}
      </div>
      <Link to="/community/course/$slug" params={{ slug }} className="mt-3 inline-flex items-center gap-1 text-sm text-primary underline">Open class discussion <ExternalLink className="size-3" /></Link>
      {tab === "stream" && <Stream slug={slug} userId={userId} onNavigate={onNavigate} />}
      {tab === "classwork" && <Classwork slug={slug} userId={userId} isAdmin={isAdmin} onNavigate={onNavigate} />}
      {tab === "people" && <People slug={slug} userId={userId} />}
      {tab === "grades" && <Grades slug={slug} />}
    </div>
  );
}

/* ---------- Stream ---------- */
function Stream({ slug, userId, onNavigate }: { slug: string; userId: string; onNavigate: (t: string) => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "", color: "navy" });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [ef, setEf] = useState({ title: "", body: "", color: "navy" });
  const [eKeep, setEKeep] = useState<NoticeFile[]>([]);
  const [eNew, setENew] = useState<File[]>([]);
  const [eRemoved, setERemoved] = useState<NoticeFile[]>([]);
  const { data: notices = [] } = useQuery({ queryKey: ["t-notices", slug], queryFn: async () => (await supabase.from("course_notices").select("*").eq("course_slug", slug).order("created_at", { ascending: false })).data ?? [] });
  const { data: next = [] } = useQuery({ queryKey: ["c-next", slug, userId], queryFn: async () => ((await supabase.from("live_sessions").select("*").eq("course_slug", slug).eq("trainer_id", userId).neq("status", "cancelled").gte("starts_at", new Date().toISOString()).order("starts_at").limit(3)).data ?? []) as Session[] });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["t-notices", slug] });
  const post = async () => {
    if (!f.title.trim()) return void toast.error("Add a title");
    setBusy(true);
    const attachments = await uploadNoticeFiles(slug, files);
    const { error } = await supabase.from("course_notices").insert({ course_slug: slug, title: f.title.trim(), body: f.body, color: f.color, created_by: userId, attachments } as never);
    setBusy(false);
    if (error) { await removeNoticeFiles(attachments); return void toast.error("Couldn't post"); }
    setF({ title: "", body: "", color: "navy" }); setFiles([]); refresh(); toast.success("Announcement posted");
  };
  const save = async (id: string) => {
    if (!ef.title.trim()) return void toast.error("Add a title");
    setBusy(true);
    const added = await uploadNoticeFiles(slug, eNew);
    const { error } = await supabase.from("course_notices").update({ title: ef.title.trim(), body: ef.body, color: ef.color, attachments: [...eKeep, ...added] } as never).eq("id", id);
    setBusy(false);
    if (error) { await removeNoticeFiles(added); return void toast.error("Couldn't save"); }
    await removeNoticeFiles(eRemoved);
    setEditing(null); refresh(); toast.success("Announcement updated");
  };
  const del = async (id: string, att: NoticeFile[]) => {
    if (!confirm("Delete this announcement?")) return;
    const { error } = await supabase.from("course_notices").delete().eq("id", id);
    if (error) return void toast.error("Couldn't delete");
    await removeNoticeFiles(att);
    refresh();
  };
  const Colours = ({ value, onPick }: { value: string; onPick: (c: string) => void }) => (
    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Accent</span>{Object.keys(noticeColor).map(c => <button key={c} type="button" onClick={() => onPick(c)} aria-pressed={value === c} className={`rounded-full border-2 px-3 py-0.5 text-xs capitalize ${noticeColor[c]} ${value === c ? "ring-2 ring-ring" : ""}`}>{c}</button>)}</div>
  );
  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="space-y-2 self-start rounded-md border border-border p-4">
        <p className="text-sm font-semibold text-primary">Upcoming</p>
        {next.length === 0 ? <p className="text-xs text-muted-foreground">No classes scheduled.</p> : next.map(s => <SessionLine key={s.id} s={s} />)}
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => onNavigate("live")}>Schedule a class</Button>
      </aside>
      <div className="space-y-4">
        <div className="space-y-2 rounded-md border border-border p-4">
          <Input placeholder="Announce something to your class" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={120} />
          {f.title && <><Textarea placeholder="Details (optional)" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} maxLength={2000} /><PendingFiles files={files} onChange={setFiles} /><Colours value={f.color} onPick={color => setF({ ...f, color })} /><Button size="sm" disabled={busy} onClick={() => void post()}>{busy ? "Posting…" : "Post"}</Button></>}
        </div>
        {notices.length === 0 ? <p className="text-sm text-muted-foreground">No announcements yet.</p> : notices.map(n => { const att = asFiles((n as { attachments?: unknown }).attachments); return (
          <article key={n.id} className={`rounded-md border-l-4 p-4 ${noticeColor[n.color] ?? ""}`}>
            {editing === n.id ? <div className="space-y-2">
              <Input value={ef.title} onChange={e => setEf({ ...ef, title: e.target.value })} maxLength={120} />
              <Textarea value={ef.body} onChange={e => setEf({ ...ef, body: e.target.value })} maxLength={2000} />
              <NoticeFileList files={eKeep} onRemove={x => { setEKeep(eKeep.filter(k => k.path !== x.path)); setERemoved([...eRemoved, x]); }} />
              <PendingFiles files={eNew} onChange={setENew} />
              <Colours value={ef.color} onPick={color => setEf({ ...ef, color })} />
              <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => void save(n.id)}>{busy ? "Saving…" : "Save"}</Button><Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button></div>
            </div> : <>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(n.created_at)}</p></div>
                <div className="flex shrink-0 gap-3 text-xs"><button className="text-primary underline" onClick={() => { setEditing(n.id); setEf({ title: n.title, body: n.body ?? "", color: n.color }); setEKeep(att); setENew([]); setERemoved([]); }}>Edit</button><button className="text-muted-foreground underline hover:text-destructive" onClick={() => void del(n.id, att)}>Delete</button></div></div>
              {n.body && <p className="mt-2 whitespace-pre-line text-sm">{n.body}</p>}
              <NoticeFileList files={att} />
            </>}
          </article>
        ))}
      </div>
    </div>
  );
}

export function SessionLine({ s }: { s: Session }) {
  const mode = s.mode ?? "online";
  return <div className="text-xs"><p className="font-medium text-foreground">{s.title}</p><p className="text-muted-foreground">{fmtDateTime(s.starts_at)} · {modeLabel[mode]}</p>
    {mode !== "online" && s.location && <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{s.location}</p>}
    {mode !== "in_person" && s.meeting_url && <a href={safe(s.meeting_url)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary underline"><Video className="size-3" />Meeting link</a>}</div>;
}

/* ---------- Classwork ---------- */
function Classwork({ slug, userId, isAdmin, onNavigate }: { slug: string; userId: string; isAdmin: boolean; onNavigate: (t: string) => void }) {
  const [drawer, setDrawer] = useState<Drawer>(null);
  const { data: lessons = [] } = useQuery({ queryKey: ["t-lessons", slug], queryFn: async () => ((await supabase.from("lessons").select("*").eq("course_slug", slug).order("position").order("created_at")).data ?? []) as (Lesson & { topic?: string | null })[] });
  const { data: quizzes = [] } = useQuery({ queryKey: ["c-quizzes", slug], queryFn: async () => ((await supabase.from("quizzes").select("*, quiz_questions(id, prompt, options, position, kind), quiz_attempts(score, passed)").eq("course_slug", slug).order("created_at")).data ?? []) as unknown as Quiz[] });
  const { data: asgs = [] } = useQuery({ queryKey: ["t-asg", slug], queryFn: async () => ((await supabase.from("assignments").select("*, assignment_submissions(*)").eq("course_slug", slug).order("created_at")).data ?? []) as unknown as Asg[] });
  const groups = useMemo(() => {
    const m = new Map<string, typeof lessons>();
    for (const l of lessons) { const k = l.topic?.trim() || "Lessons"; m.set(k, [...(m.get(k) ?? []), l]); }
    return [...m.entries()];
  }, [lessons]);
  const Row = ({ icon: I, title, meta, onClick }: { icon: typeof FileText; title: string; meta: string; onClick: () => void }) => (
    <li><button onClick={onClick} className="flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left hover:bg-muted">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><I className="size-4" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{title}</span><span className="block text-xs text-muted-foreground">{meta}</span></span></button></li>
  );
  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="mr-1 self-center text-sm text-muted-foreground"><Plus className="inline size-4" /> Create:</span>
        {[["lessons", "Lesson"], ["quizzes", "Quiz"], ["assignments", "Assignment"], ["plans", "Session plan"]].map(([t, l]) => <Button key={t} size="sm" variant="outline" onClick={() => onNavigate(t!)}>{l}</Button>)}
      </div>
      {groups.length === 0 && <p className="text-sm text-muted-foreground">No lessons yet.</p>}
      {groups.map(([topic, ls]) => (
        <section key={topic}><h3 className="border-b border-border pb-1 font-serif text-lg text-primary">{topic}</h3>
          <ul className="mt-1">{ls.map((l, i) => <Row key={l.id} icon={FileText} title={`${i + 1}. ${l.title}`} meta={[l.video_url && "video", l.file_url && "materials", l.unlock_at && `opens ${new Date(l.unlock_at).toLocaleDateString("en-SG")}`].filter(Boolean).join(" · ") || "Lesson"} onClick={() => setDrawer({ kind: "lesson", item: l })} />)}</ul></section>
      ))}
      <section><h3 className="border-b border-border pb-1 font-serif text-lg text-primary">Quizzes</h3>
        {quizzes.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No quizzes yet.</p> : <ul className="mt-1">{quizzes.map(q => <Row key={q.id} icon={HelpCircle} title={q.title} meta={`${q.quiz_questions.length} questions · pass ${q.pass_mark}% · ${q.quiz_attempts.length} attempts`} onClick={() => setDrawer({ kind: "quiz", item: q })} />)}</ul>}</section>
      <section><h3 className="border-b border-border pb-1 font-serif text-lg text-primary">Assignments</h3>
        {asgs.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No assignments yet.</p> : <ul className="mt-1">{asgs.map(a => <Row key={a.id} icon={ClipboardCheck} title={a.title} meta={`${a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"} · ${a.assignment_submissions.length} handed in`} onClick={() => setDrawer({ kind: "asg", item: a })} />)}</ul>}</section>
      <ItemDrawer drawer={drawer} onClose={() => setDrawer(null)} slug={slug} canEdit={drawer?.kind === "lesson" ? drawer.item.created_by === userId || isAdmin : true} />
    </div>
  );
}

function ItemDrawer({ drawer, onClose, slug, canEdit }: { drawer: Drawer; onClose: () => void; slug: string; canEdit: boolean }) {
  return (
    <Sheet open={!!drawer} onOpenChange={o => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {drawer?.kind === "lesson" && <LessonEditor key={drawer.item.id} lesson={drawer.item} slug={slug} canEdit={canEdit} onDone={onClose} />}
        {drawer?.kind === "quiz" && <QuizView key={drawer.item.id} quiz={drawer.item} />}
        {drawer?.kind === "asg" && <AsgView key={drawer.item.id} a={drawer.item} slug={slug} />}
      </SheetContent>
    </Sheet>
  );
}

function LessonEditor({ lesson, slug, canEdit, onDone }: { lesson: Lesson & { topic?: string | null }; slug: string; canEdit: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: lesson.title, topic: lesson.topic ?? "", body: lesson.body ?? "", video_url: lesson.video_url ?? "", file_url: lesson.file_url ?? "" });
  const save = async () => {
    const { error } = await supabase.from("lessons").update({ title: f.title.trim() || lesson.title, topic: f.topic.trim() || null, body: f.body || null, video_url: f.video_url || null, file_url: f.file_url || null }).eq("id", lesson.id);
    if (error) return void toast.error(error.message);
    toast.success("Lesson saved"); void qc.invalidateQueries({ queryKey: ["t-lessons", slug] }); void qc.invalidateQueries({ queryKey: ["t-lesson-history"] }); onDone();
  };
  if (!canEdit) return <><SheetHeader><SheetTitle>{lesson.title}</SheetTitle><SheetDescription>{lesson.topic || "Lesson"}</SheetDescription></SheetHeader><LessonBody l={lesson} /></>;
  return (
    <div className="space-y-3">
      <SheetHeader><SheetTitle>Edit lesson</SheetTitle><SheetDescription>Changes appear for enrolled students straight away.</SheetDescription></SheetHeader>
      <label className="block text-sm">Title<Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></label>
      <label className="block text-sm">Module / topic<Input placeholder="e.g. Module 1: Foundations" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} /></label>
      <label className="block text-sm">Lesson notes<Textarea rows={10} value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></label>
      <label className="block text-sm">Video link<Input value={f.video_url} onChange={e => setF({ ...f, video_url: e.target.value })} /></label>
      <label className="block text-sm">Materials link<Input value={f.file_url} onChange={e => setF({ ...f, file_url: e.target.value })} /></label>
      <Button onClick={() => void save()}>Save lesson</Button>
    </div>
  );
}

export function LessonBody({ l }: { l: Lesson }) {
  return <div className="mt-4 space-y-3 text-sm">{l.body ? <p className="whitespace-pre-line">{l.body}</p> : <p className="text-muted-foreground">No notes added.</p>}
    {l.video_url && <a className="block text-primary underline" href={safe(l.video_url)} target="_blank" rel="noreferrer">Watch video</a>}
    {l.file_url && <a className="block text-primary underline" href={safe(l.file_url)} target="_blank" rel="noreferrer">Open materials</a>}</div>;
}

function QuizView({ quiz }: { quiz: Quiz }) {
  const { data: keys = [] } = useQuery({ queryKey: ["c-keys", quiz.id], queryFn: async () => ((await supabase.from("quiz_answer_keys").select("*").in("question_id", quiz.quiz_questions.map(q => q.id))).data ?? []) as { question_id: string; correct: number; accepted: string[] | null }[] });
  const qs = [...quiz.quiz_questions].sort((a, b) => a.position - b.position);
  const avg = quiz.quiz_attempts.length ? Math.round(quiz.quiz_attempts.reduce((s, a) => s + a.score, 0) / quiz.quiz_attempts.length) : null;
  return (
    <div>
      <SheetHeader><SheetTitle>{quiz.title}</SheetTitle><SheetDescription>Pass {quiz.pass_mark}%{quiz.gives_certificate && " · gives a certificate"} · {quiz.quiz_attempts.length} attempts{avg !== null && ` · average ${avg}%`}</SheetDescription></SheetHeader>
      <ol className="mt-4 space-y-4">{qs.map((q, i) => { const k = keys.find(x => x.question_id === q.id); return (
        <li key={q.id} className="text-sm"><p className="font-medium">{i + 1}. {q.prompt} <span className="text-xs font-normal text-muted-foreground">({q.kind === "short" ? "Fill in" : "Multiple choice"})</span></p>
          {q.kind === "short" ? <p className="mt-1 text-xs">Accepted: <b>{(k?.accepted ?? []).join(", ") || "—"}</b></p>
            : <ul className="mt-1 space-y-0.5">{q.options.map((o, j) => <li key={j} className={k?.correct === j ? "font-semibold text-primary" : "text-muted-foreground"}>{k?.correct === j ? "✓ " : "• "}{o}</li>)}</ul>}</li>); })}</ol>
    </div>
  );
}

function AsgView({ a, slug }: { a: Asg; slug: string }) {
  return (
    <div>
      <SheetHeader><SheetTitle>{a.title}</SheetTitle><SheetDescription>{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"} · out of {a.max_score}</SheetDescription></SheetHeader>
      {a.instructions && <p className="mt-4 whitespace-pre-line text-sm">{a.instructions}</p>}
      <h4 className="mt-6 text-sm font-semibold">Handed in ({a.assignment_submissions.length})</h4>
      {a.assignment_submissions.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : <SpeedGrader subs={a.assignment_submissions} max={a.max_score} slug={slug} />}
    </div>
  );
}

/* ---------- SpeedGrader ---------- */
function SpeedGrader({ subs, max, slug, start = 0 }: { subs: Sub[]; max: number; slug: string; start?: number }) {
  const qc = useQueryClient();
  const [i, setI] = useState(start);
  const s = subs[Math.min(i, subs.length - 1)]!;
  const [g, setG] = useState<Record<string, { score: string; feedback: string }>>({});
  const cur = g[s.id] ?? { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
  const save = async (advance: boolean) => {
    const { error } = await supabase.from("assignment_submissions").update({ score: cur.score === "" ? null : Math.min(max, +cur.score), feedback: cur.feedback, status: "graded" }).eq("id", s.id);
    if (error) return void toast.error("Couldn't save the grade");
    toast.success("Grade saved"); void qc.invalidateQueries({ queryKey: ["t-asg", slug] });
    if (advance && i < subs.length - 1) setI(i + 1);
  };
  return (
    <div className="mt-3 rounded-md border border-border">
      <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm">
        <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Previous student"><ChevronLeft /></Button>
        <span className="font-medium">{s.student_name} <span className="text-xs text-muted-foreground">({i + 1}/{subs.length}){s.status === "graded" && " · graded"}</span></span>
        <Button variant="ghost" size="icon" disabled={i >= subs.length - 1} onClick={() => setI(i + 1)} aria-label="Next student"><ChevronRight /></Button>
      </div>
      <div className="space-y-3 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Handed in {fmtDateTime(s.created_at)}</p>
        {s.body ? <p className="max-h-60 overflow-y-auto whitespace-pre-line rounded bg-muted/50 p-3">{s.body}</p> : <p className="text-muted-foreground">No written answer.</p>}
        {s.link && <a href={safe(s.link)} target="_blank" rel="noreferrer" className="text-primary underline">Open their file</a>}
        <div className="flex items-center gap-2"><Input className="w-24" type="number" placeholder="Score" value={cur.score} onChange={e => setG({ ...g, [s.id]: { ...cur, score: e.target.value } })} /><span className="text-muted-foreground">/ {max}</span></div>
        <Textarea placeholder="Feedback for the student" value={cur.feedback} onChange={e => setG({ ...g, [s.id]: { ...cur, feedback: e.target.value } })} />
        <div className="flex gap-2"><Button size="sm" onClick={() => void save(false)}>Save</Button>{i < subs.length - 1 && <Button size="sm" variant="outline" onClick={() => void save(true)}>Save & next</Button>}</div>
      </div>
    </div>
  );
}

/* ---------- People ---------- */
type Roster = { course_slug: string; student_name: string; student_email: string; progress: number; lessons_done: number; status: string; start_date: string };
function People({ slug, userId }: { slug: string; userId: string }) {
  const { data = [] } = useQuery({ queryKey: ["t-roster", userId], queryFn: async () => ((await supabase.rpc("trainer_roster" as never)).data ?? []) as unknown as Roster[] });
  const rows = data.filter(r => r.course_slug === slug).sort((a, b) => a.student_name.localeCompare(b.student_name));
  return rows.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">No students enrolled in this course yet.</p> : (
    <div className="mt-6 overflow-x-auto"><p className="mb-2 text-sm text-muted-foreground">{rows.length} students</p>
      <table className="w-full min-w-[560px] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">Student</th><th>Status</th><th>Lessons done</th><th>Progress</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.student_email + r.start_date} className="border-b border-border"><td className="py-2"><p className="font-medium">{r.student_name}</p><a href={`mailto:${r.student_email}`} className="text-xs text-muted-foreground underline">{r.student_email}</a></td><td className="capitalize">{r.status}</td><td>{r.lessons_done}</td>
          <td><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${r.progress}%` }} /></div><span className="text-xs">{r.progress}%</span></div></td></tr>)}</tbody></table></div>
  );
}

/* ---------- Grades ---------- */
function Grades({ slug }: { slug: string }) {
  const { data: asgs = [] } = useQuery({ queryKey: ["t-asg", slug], queryFn: async () => ((await supabase.from("assignments").select("*, assignment_submissions(*)").eq("course_slug", slug).order("created_at")).data ?? []) as unknown as Asg[] });
  const [open, setOpen] = useState<{ a: Asg; i: number } | null>(null);
  const students = [...new Set(asgs.flatMap(a => a.assignment_submissions.map(s => s.student_name)))].sort();
  const pending = asgs.reduce((n, a) => n + a.assignment_submissions.filter(s => s.status !== "graded").length, 0);
  if (asgs.length === 0) return <p className="mt-6 text-sm text-muted-foreground">No assignments yet, so there is nothing to grade.</p>;
  return (
    <div className="mt-6">
      <p className="mb-2 text-sm text-muted-foreground">{pending} waiting to be graded. Click a cell to open the grader.</p>
      {students.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-4">Student</th>{asgs.map(a => <th key={a.id} className="px-2 font-medium">{a.title}<br /><span className="font-normal">/ {a.max_score}</span></th>)}</tr></thead>
          <tbody>{students.map(name => <tr key={name} className="border-b border-border"><td className="py-2 pr-4 font-medium">{name}</td>{asgs.map(a => {
            const idx = a.assignment_submissions.findIndex(s => s.student_name === name); const s = a.assignment_submissions[idx];
            return <td key={a.id} className="px-2">{!s ? <span className="text-muted-foreground">—</span> : <button onClick={() => setOpen({ a, i: idx })} className={`rounded px-2 py-1 text-xs ${s.status === "graded" ? "bg-muted" : "bg-brand-gold/20 font-semibold"}`}>{s.status === "graded" ? (s.score ?? "✓") : "To grade"}</button>}</td>;
          })}</tr>)}</tbody></table></div>
      )}
      <Sheet open={!!open} onOpenChange={o => !o && setOpen(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{open && <><SheetHeader><SheetTitle>{open.a.title}</SheetTitle><SheetDescription>Out of {open.a.max_score}</SheetDescription></SheetHeader><SpeedGrader key={open.a.id + open.i} subs={open.a.assignment_submissions} max={open.a.max_score} slug={slug} start={open.i} /></>}</SheetContent>
      </Sheet>
    </div>
  );
}
