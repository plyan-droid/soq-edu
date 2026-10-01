import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { fmtDateTime } from "@/lib/learning";
import { useTrainerCourses } from "@/components/trainer-overview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentFileList, assignmentFiles } from "@/components/assignment-files";

const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
const card = "rounded-lg border border-border bg-card p-5";

function MyCoursePicker({ userId, isAdmin, value, onChange }: { userId: string; isAdmin: boolean; value: string; onChange: (v: string) => void }) {
  const { data: mine = [] } = useTrainerCourses(userId);
  const list = isAdmin ? courses.map(c => c.slug) : mine;
  if (list.length === 0) return <p className="text-sm text-muted-foreground">Add your courses in My courses first.</p>;
  if (!list.includes(value) && list[0]) setTimeout(() => onChange(list[0]!), 0);
  return <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={e => onChange(e.target.value)}>{list.map(s => <option key={s} value={s}>{courseName(s)}</option>)}</select>;
}

/* ---------- Quizzes ---------- */
type Q = { prompt: string; options: string[]; correct: number; kind: "mcq" | "short"; accepted: string };
export function TrainerQuizzes({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [pass, setPass] = useState(70);
  const [cert, setCert] = useState(false);
  const [qs, setQs] = useState<Q[]>([{ prompt: "", options: ["", "", "", ""], correct: 0, kind: "mcq", accepted: "" }]);
  const { data = [] } = useQuery({ enabled: !!slug, queryKey: ["t-quizzes", slug], queryFn: async () => {
    const { data: quizzes } = await supabase.from("quizzes").select("*, quiz_questions(id), quiz_attempts(score, passed)").eq("course_slug", slug).order("created_at", { ascending: false });
    return quizzes ?? [];
  } });
  const save = async () => {
    const clean = qs.map(q => ({ ...q, prompt: q.prompt.trim(), options: q.kind === "short" ? [] : q.options.map(o => o.trim()).filter(Boolean), acc: q.accepted.split(",").map(a => a.trim()).filter(Boolean) })).filter(q => q.prompt && (q.kind === "short" ? q.acc.length > 0 : q.options.length >= 2));
    if (!title.trim() || clean.length === 0) { toast.error("Add a title and at least one complete question"); return; }
    const { data: quiz, error } = await supabase.from("quizzes").insert({ course_slug: slug, title: title.trim(), pass_mark: pass, gives_certificate: cert, created_by: userId }).select().single();
    if (error || !quiz) { toast.error("Couldn't save the quiz"); return; }
    for (const [i, q] of clean.entries()) {
      const { data: row } = await supabase.from("quiz_questions").insert({ quiz_id: quiz.id, prompt: q.prompt, options: q.options, position: i, kind: q.kind }).select().single();
      if (row) await supabase.from("quiz_answer_keys").insert(q.kind === "short" ? { question_id: row.id, correct: 0, accepted: q.acc } : { question_id: row.id, correct: Math.min(q.correct, q.options.length - 1) });
    }
    toast.success("Quiz saved"); setTitle(""); setQs([{ prompt: "", options: ["", "", "", ""], correct: 0, kind: "mcq", accepted: "" }]);
    void qc.invalidateQueries({ queryKey: ["t-quizzes", slug] });
  };
  const del = async (id: string) => { if (!confirm("Delete this quiz and all its results?")) return; await supabase.from("quizzes").delete().eq("id", id); void qc.invalidateQueries({ queryKey: ["t-quizzes", slug] }); };
  const upd = (i: number, p: Partial<Q>) => setQs(qs.map((q, j) => j === i ? { ...q, ...p } : q));
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className={`${card} space-y-3`}>
        <MyCoursePicker userId={userId} isAdmin={isAdmin} value={slug} onChange={setSlug} />
        <Input placeholder="Quiz title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">Pass mark % <Input type="number" min={1} max={100} className="w-20" value={pass} onChange={e => setPass(Math.max(1, Math.min(100, +e.target.value || 70)))} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={cert} onChange={e => setCert(e.target.checked)} /> Give a certificate when passed</label>
        </div>
        {qs.map((q, i) => (
          <div key={i} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex gap-2"><Input placeholder={`Question ${i + 1}`} value={q.prompt} onChange={e => upd(i, { prompt: e.target.value })} />{qs.length > 1 && <Button variant="ghost" size="icon" aria-label="Remove question" onClick={() => setQs(qs.filter((_, j) => j !== i))}><Trash2 /></Button>}</div>
            <div className="flex gap-1 text-xs">{([["mcq", "Multiple choice"], ["short", "Fill in the answer"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => upd(i, { kind: v })} className={`rounded-full border px-3 py-1 ${q.kind === v ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{l}</button>)}</div>
            {q.kind === "short" ? <><Input placeholder="Accepted answers, separated by commas (e.g. Generative AI, GenAI)" value={q.accepted} onChange={e => upd(i, { accepted: e.target.value })} /><p className="text-xs text-muted-foreground">Students type their answer. Capital letters and extra spaces are ignored.</p></> : <>
            {q.options.map((o, k) => (
              <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name={`c${i}`} checked={q.correct === k} onChange={() => upd(i, { correct: k })} title="Correct answer" />
                <Input placeholder={`Answer ${k + 1}${k < 2 ? "" : " (optional)"}`} value={o} onChange={e => upd(i, { options: q.options.map((x, m) => m === k ? e.target.value : x) })} /></label>
            ))}
            <p className="text-xs text-muted-foreground">Tick the circle next to the correct answer.</p></>}
          </div>
        ))}
        <div className="flex gap-2"><Button variant="outline" onClick={() => setQs([...qs, { prompt: "", options: ["", "", "", ""], correct: 0, kind: "mcq", accepted: "" }])}><Plus /> Add question</Button><Button className="rounded-full" onClick={() => void save()}>Save quiz</Button></div>
      </div>
      <div>
        <h2 className="font-serif text-2xl text-primary">Quizzes{slug && ` · ${courseName(slug)}`}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Open Courses → Classroom → Classwork to see each quiz's questions and answers.</p>
        {data.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No quizzes yet.</p> : <ul className="mt-3 space-y-2">{data.map(q => {
          const at = (q.quiz_attempts ?? []) as { score: number; passed: boolean }[];
          const avg = at.length ? Math.round(at.reduce((s, a) => s + a.score, 0) / at.length) : null;
          return <li key={q.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
            <span><b>{q.title}</b> · {(q.quiz_questions ?? []).length} questions · pass {q.pass_mark}%{q.gives_certificate && " · certificate"}<br /><span className="text-muted-foreground">{at.length} attempts{avg !== null && ` · average ${avg}% · ${at.filter(a => a.passed).length} passed`}</span></span>
            <button aria-label="Delete quiz" onClick={() => void del(q.id)}><Trash2 className="size-4 text-muted-foreground" /></button></li>;
        })}</ul>}
      </div>
    </div>
  );
}

/* ---------- Assignments ---------- */
export function TrainerAssignments({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [f, setF] = useState({ title: "", instructions: "", due: "", max: 100 });
  const [grade, setGrade] = useState<Record<string, { score: string; feedback: string }>>({});
  const { data = [] } = useQuery({ enabled: !!slug, queryKey: ["t-asg", slug], queryFn: async () => (await supabase.from("assignments").select("*, assignment_submissions(*)").eq("course_slug", slug).order("created_at", { ascending: false })).data ?? [] });
  const add = async () => {
    if (!f.title.trim()) { toast.error("Give the assignment a title"); return; }
    const { error } = await supabase.from("assignments").insert({ course_slug: slug, title: f.title.trim(), instructions: f.instructions, due_at: f.due ? new Date(f.due).toISOString() : null, max_score: f.max, created_by: userId });
    if (error) { toast.error("Couldn't save"); return; }
    setF({ title: "", instructions: "", due: "", max: 100 }); void qc.invalidateQueries({ queryKey: ["t-asg", slug] });
  };
  const saveGrade = async (id: string) => {
    const g = grade[id]; if (!g) return;
    const max = data.find(a => a.assignment_submissions?.some(s => s.id === id))?.max_score ?? 100;
    if (g.score === "" || !Number.isInteger(+g.score) || +g.score < 0 || +g.score > max) return void toast.error(`Enter a mark between 0 and ${max}`);
    const { error } = await supabase.from("assignment_submissions").update({ score: +g.score, feedback: g.feedback, status: "graded" }).eq("id", id);
    if (error) { toast.error("Couldn't save the grade"); return; }
    toast.success("Work returned to learner"); void qc.invalidateQueries({ queryKey: ["t-asg", slug] }); void qc.invalidateQueries({ queryKey: ["s-asg", slug] }); void qc.invalidateQueries({ queryKey: ["learn", slug] });
  };
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className={`${card} space-y-3 self-start`}>
        <MyCoursePicker userId={userId} isAdmin={isAdmin} value={slug} onChange={setSlug} />
        <Input placeholder="Assignment title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={150} />
        <Textarea placeholder="Instructions" value={f.instructions} onChange={e => setF({ ...f, instructions: e.target.value })} />
        <label className="block text-sm">Due<Input type="datetime-local" value={f.due} onChange={e => setF({ ...f, due: e.target.value })} /></label>
        <label className="block text-sm">Max score<Input type="number" value={f.max} onChange={e => setF({ ...f, max: +e.target.value || 100 })} /></label>
        <Button className="rounded-full" onClick={() => void add()}>Add assignment</Button>
      </div>
      <div className="space-y-4">
        {data.length === 0 && <p className="text-sm text-muted-foreground">No assignments yet.</p>}
        {data.map(a => (
          <div key={a.id} className={card}>
            <div className="flex justify-between"><div><h3 className="font-semibold text-primary">{a.title}</h3><p className="text-xs text-muted-foreground">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"} · out of {a.max_score}</p></div>
              <button aria-label="Delete assignment" onClick={async () => { if (confirm("Delete this assignment?")) { await supabase.from("assignments").delete().eq("id", a.id); void qc.invalidateQueries({ queryKey: ["t-asg", slug] }); } }}><Trash2 className="size-4 text-muted-foreground" /></button></div>
            <ul className="mt-3 space-y-3">
              {(a.assignment_submissions ?? []).length === 0 && <li className="text-sm text-muted-foreground">No submissions yet.</li>}
              {(a.assignment_submissions ?? []).map(s => {
                const g = grade[s.id] ?? { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
                return <li key={s.id} className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">{s.student_name} <span className="text-xs text-muted-foreground">· {fmtDateTime(s.created_at)}{a.due_at && new Date(s.created_at) > new Date(a.due_at) && " · LATE"}</span></p>
                  {s.body && <p className="mt-1 whitespace-pre-line">{s.body}</p>}
                  {s.link && <a href={s.link.startsWith("http") ? s.link : `https://${s.link}`} target="_blank" rel="noreferrer" className="text-primary underline">Open their link</a>}
                  <AssignmentFileList files={assignmentFiles(s.files)} />
                  <div className="mt-2 flex flex-wrap gap-2"><Input className="w-24" placeholder="Score" type="number" value={g.score} onChange={e => setGrade({ ...grade, [s.id]: { ...g, score: e.target.value } })} />
                    <Input className="min-w-48 flex-1" placeholder="Feedback" value={g.feedback} onChange={e => setGrade({ ...grade, [s.id]: { ...g, feedback: e.target.value } })} />
                    <Button size="sm" onClick={() => void saveGrade(s.id)}>{s.status === "graded" ? "Update returned mark" : "Return to learner"}</Button></div>
                </li>;
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Attendance ---------- */
export function TrainerAttendance({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [sid, setSid] = useState("");
  const { data: sessions = [] } = useQuery({ queryKey: ["t-att-sessions", userId], queryFn: async () => (await supabase.from("live_sessions").select("*").eq("trainer_id", userId).neq("status", "cancelled").lte("starts_at", new Date(Date.now() + 86400e3).toISOString()).order("starts_at", { ascending: false }).limit(50)).data ?? [] });
  const { data } = useQuery({ enabled: !!sid, queryKey: ["t-att", sid], queryFn: async () => {
    const [r, a] = await Promise.all([supabase.rpc("session_roster", { _session: sid }), supabase.from("attendance").select("*").eq("session_id", sid)]);
    return { roster: r.data ?? [], marks: Object.fromEntries((a.data ?? []).map(x => [x.student_id, x.status])) as Record<string, string> };
  } });
  const mark = async (student: string, status: string) => {
    const { error } = await supabase.from("attendance").upsert({ session_id: sid, student_id: student, status, marked_at: new Date().toISOString() });
    if (error) { toast.error("Couldn't save"); return; }
    void qc.invalidateQueries({ queryKey: ["t-att", sid] });
  };
  return (
    <div className={`mt-6 ${card}`}>
      <label className="text-sm font-medium">Live class</label>
      <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sid} onChange={e => setSid(e.target.value)}>
        <option value="">Choose a class…</option>{sessions.map(s => <option key={s.id} value={s.id}>{fmtDateTime(s.starts_at)} · {s.title} · {courseName(s.course_slug)}</option>)}
      </select>
      {sessions.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No past or current classes yet.</p>}
      {data && (data.roster.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No students are enrolled in this course.</p> : (
        <table className="mt-4 w-full text-sm"><tbody>{data.roster.map(r => (
          <tr key={r.student_id} className="border-t border-border"><td className="py-2">{r.student_name}<br /><span className="text-xs text-muted-foreground">{r.student_email}</span></td>
            <td className="py-2 text-right">{(["present", "late", "absent"] as const).map(s => (
              <button key={s} onClick={() => void mark(r.student_id, s)} className={`ml-1 rounded-full border px-3 py-1 text-xs capitalize ${data.marks[r.student_id] === s ? (s === "absent" ? "border-destructive bg-destructive text-destructive-foreground" : "border-primary bg-primary text-primary-foreground") : "border-border"}`}>{s}</button>))}</td></tr>
        ))}</tbody></table>
      ))}
      {data && data.roster.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{Object.values(data.marks).filter(m => m !== "absent").length} of {data.roster.length} attended</p>}
    </div>
  );
}

/* ---------- Course notices ---------- */
export const noticeColor: Record<string, string> = { gold: "border-brand-gold bg-brand-gold/10", navy: "border-primary bg-primary/5", red: "border-destructive bg-destructive/10", green: "border-emerald-600 bg-emerald-600/10" };
export function TrainerNotices({ userId, isAdmin }: { userId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [f, setF] = useState({ title: "", body: "", color: "gold" });
  const { data = [] } = useQuery({ enabled: !!slug, queryKey: ["t-notices", slug], queryFn: async () => (await supabase.from("course_notices").select("*").eq("course_slug", slug).order("created_at", { ascending: false })).data ?? [] });
  const add = async () => {
    if (!f.title.trim()) { toast.error("Add a title"); return; }
    const { error } = await supabase.from("course_notices").insert({ course_slug: slug, title: f.title.trim(), body: f.body, color: f.color, created_by: userId });
    if (error) { toast.error("Couldn't post"); return; }
    setF({ title: "", body: "", color: "gold" }); void qc.invalidateQueries({ queryKey: ["t-notices", slug] });
  };
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className={`${card} space-y-3 self-start`}>
        <MyCoursePicker userId={userId} isAdmin={isAdmin} value={slug} onChange={setSlug} />
        <Input placeholder="Notice title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={120} />
        <Textarea placeholder="Message" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} maxLength={2000} />
        <div className="flex gap-2">{Object.keys(noticeColor).map(c => <button key={c} onClick={() => setF({ ...f, color: c })} className={`rounded-full border-2 px-3 py-1 text-xs capitalize ${noticeColor[c]} ${f.color === c ? "ring-2 ring-ring" : ""}`}>{c}</button>)}</div>
        <Button className="rounded-full" onClick={() => void add()}>Post notice</Button>
      </div>
      <ul className="space-y-3">{data.length === 0 && <li className="text-sm text-muted-foreground">No notices yet.</li>}{data.map(n => (
        <li key={n.id} className={`rounded-md border-l-4 p-4 ${noticeColor[n.color]}`}><div className="flex justify-between"><b>{n.title}</b><button aria-label="Delete notice" onClick={async () => { await supabase.from("course_notices").delete().eq("id", n.id); void qc.invalidateQueries({ queryKey: ["t-notices", slug] }); }}><Trash2 className="size-4 text-muted-foreground" /></button></div><p className="mt-1 whitespace-pre-line text-sm">{n.body}</p></li>
      ))}</ul>
    </div>
  );
}

/* ---------- Course stats ---------- */
export function TrainerStats({ userId }: { userId: string }) {
  const { data: mine = [] } = useTrainerCourses(userId);
  const { data } = useQuery({ enabled: mine.length > 0, queryKey: ["t-stats", userId, mine.join()], queryFn: async () => {
    const [roster, quizzes, subs, att] = await Promise.all([
      supabase.rpc("trainer_roster" as never),
      supabase.from("quizzes").select("course_slug, quiz_attempts(score, passed)").in("course_slug", mine),
      supabase.from("assignments").select("course_slug, max_score, assignment_submissions(score)").in("course_slug", mine),
      supabase.from("attendance").select("status, live_sessions!inner(course_slug, trainer_id)").eq("live_sessions.trainer_id", userId),
    ]);
    const r = ((roster.data ?? []) as unknown as { course_slug: string; progress: number }[]);
    return mine.map(slug => {
      const st = r.filter(x => x.course_slug === slug);
      const at = (quizzes.data ?? []).filter(q => q.course_slug === slug).flatMap(q => q.quiz_attempts ?? []);
      const sb = (subs.data ?? []).filter(a => a.course_slug === slug).flatMap(a => a.assignment_submissions ?? []);
      const am = (att.data ?? []).filter(a => (a.live_sessions as unknown as { course_slug: string }).course_slug === slug);
      return { slug, students: st.length, progress: st.length ? Math.round(st.reduce((s, x) => s + x.progress, 0) / st.length) : 0,
        quiz: at.length ? Math.round(at.reduce((s, x) => s + x.score, 0) / at.length) : 0, passRate: at.length ? Math.round(at.filter(x => x.passed).length * 100 / at.length) : 0,
        submissions: sb.length, attendance: am.length ? Math.round(am.filter(x => x.status !== "absent").length * 100 / am.length) : 0 };
    });
  } });
  if (mine.length === 0) return <p className="mt-6 text-sm text-muted-foreground">Add your courses in the Overview tab to see stats.</p>;
  const Bar = ({ label, v }: { label: string; v: number }) => <div className="text-xs"><div className="flex justify-between"><span>{label}</span><span>{v}%</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${v}%` }} /></div></div>;
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">{(data ?? []).map(s => (
      <div key={s.slug} className={card}>
        <h3 className="font-semibold text-primary">{courseName(s.slug)}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{s.students} students · {s.submissions} assignment submissions</p>
        <div className="mt-4 space-y-3"><Bar label="Average progress" v={s.progress} /><Bar label="Average quiz score" v={s.quiz} /><Bar label="Quiz pass rate" v={s.passRate} /><Bar label="Attendance" v={s.attendance} /></div>
      </div>))}</div>
  );
}

/* ---------- 1-to-1 slots ---------- */
export function TrainerSlots({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", topic: "1-to-1 session", when: "", dur: 30, price: 0, url: "" });
  const { data = [] } = useQuery({ queryKey: ["t-slots", userId], queryFn: async () => (await supabase.from("meeting_slots").select("*").eq("trainer_id", userId).gte("starts_at", new Date(Date.now() - 86400e3).toISOString()).order("starts_at")).data ?? [] });
  const add = async () => {
    if (!f.when || !f.name.trim()) { toast.error("Add your name and a start time"); return; }
    const { error } = await supabase.from("meeting_slots").insert({ trainer_id: userId, trainer_name: f.name.trim(), topic: f.topic, starts_at: new Date(f.when).toISOString(), duration_min: f.dur, price: f.price, meeting_url: f.url || null });
    if (error) { toast.error("Couldn't add the slot"); return; }
    setF({ ...f, when: "" }); void qc.invalidateQueries({ queryKey: ["t-slots", userId] });
  };
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[380px_1fr]">
      <div className={`${card} space-y-3 self-start`}>
        <Input placeholder="Your name as students see it" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <Input placeholder="Topic" value={f.topic} onChange={e => setF({ ...f, topic: e.target.value })} />
        <Input type="datetime-local" value={f.when} onChange={e => setF({ ...f, when: e.target.value })} />
        <div className="flex gap-2"><label className="text-sm">Minutes<Input type="number" value={f.dur} onChange={e => setF({ ...f, dur: +e.target.value || 30 })} /></label><label className="text-sm">Price (S$)<Input type="number" value={f.price} onChange={e => setF({ ...f, price: +e.target.value || 0 })} /></label></div>
        <Input placeholder="Meeting link (Zoom, Whereby…)" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
        <Button className="rounded-full" onClick={() => void add()}>Add free slot</Button>
        <p className="text-xs text-muted-foreground">Students book these on the "Book a trainer" page.</p>
      </div>
      <ul className="space-y-2">{data.length === 0 && <li className="text-sm text-muted-foreground">No upcoming slots.</li>}{data.map(s => (
        <li key={s.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
          <span><b>{fmtDateTime(s.starts_at)}</b> · {s.duration_min} min · {s.topic}{s.price > 0 && ` · S$${s.price}`}<br />
            {s.booked_by ? <span className="text-primary">Booked by {s.booked_name}{s.booked_note && ` — "${s.booked_note}"`}</span> : <span className="text-muted-foreground">Free</span>}</span>
          <button aria-label="Delete slot" onClick={async () => { await supabase.from("meeting_slots").delete().eq("id", s.id); void qc.invalidateQueries({ queryKey: ["t-slots", userId] }); }}><Trash2 className="size-4 text-muted-foreground" /></button></li>
      ))}</ul>
    </div>
  );
}
