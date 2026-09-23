import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { courseTitle, type Enrollment, type Task } from "@/components/student-dashboard";

export const Route = createFileRoute("/portal-admin")({
  head: () => ({
    meta: [
      { title: "Staff Admin | SOQ Student Portal" },
      { name: "description", content: "SOQ staff tools for managing student enrolments, progress, deadlines and assessments." },
      { property: "og:title", content: "SOQ Staff Admin" },
      { property: "og:description", content: "Manage student enrolments and assessments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Profile = { id: string; email: string; full_name: string | null };
const sel = "h-10 rounded-md border border-input bg-background px-3 text-sm";

function Admin() {
  const { isAdmin, loading } = useAuth();
  const [studentId, setStudentId] = useState<string>("");
  const { data: students = [] } = useQuery({
    queryKey: ["admin-students"], enabled: isAdmin,
    queryFn: async () => ((await supabase.from("profiles").select("id,email,full_name").order("email")).data ?? []) as Profile[],
  });
  if (loading) return <div className="mx-auto max-w-7xl px-5 py-24">Loading…</div>;
  if (!isAdmin) return <div className="mx-auto max-w-7xl px-5 py-24"><h1 className="font-serif text-4xl text-primary">Staff only</h1><p className="mt-2 text-muted-foreground">This page is for SOQ staff accounts.</p><Button asChild className="mt-5 rounded-full"><Link to="/student-portal">Back to portal</Link></Button></div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <h1 className="font-serif text-5xl text-primary">Staff admin</h1>
      <p className="mt-2 text-muted-foreground">Students appear here after they create an account. Choose one to manage their courses.</p>
      <select className={`${sel} mt-6 w-full max-w-md`} value={studentId} onChange={e => setStudentId(e.target.value)}>
        <option value="">Select a student…</option>
        {students.map(s => <option key={s.id} value={s.id}>{s.full_name ? `${s.full_name} — ` : ""}{s.email}</option>)}
      </select>
      {studentId && <StudentEditor studentId={studentId} />}
      <Applications />
    </div>
  );
}

function StudentEditor({ studentId }: { studentId: string }) {
  const qc = useQueryClient();
  const key = ["admin-student", studentId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const enr = ((await supabase.from("enrollments").select("*").eq("student_id", studentId).order("created_at")).data ?? []) as Enrollment[];
      const ids = enr.map(e => e.id);
      const tasks = ids.length ? (((await supabase.from("course_tasks").select("*").in("enrollment_id", ids).order("due_at")).data ?? []) as Task[]) : [];
      return { enr, tasks };
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: key });
  const [slug, setSlug] = useState(courses[0]?.slug ?? "");
  const [start, setStart] = useState(""); const [end, setEnd] = useState("");

  const addEnrollment = async () => {
    await supabase.from("enrollments").insert({ student_id: studentId, course_slug: slug, start_date: start || null, end_date: end || null });
    refresh();
  };

  return (
    <div className="mt-8 grid gap-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="font-serif text-2xl text-primary">Enrol in a course</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <select className={`${sel} min-w-72 flex-1`} value={slug} onChange={e => setSlug(e.target.value)}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
          <Input type="date" className="w-44" value={start} onChange={e => setStart(e.target.value)} aria-label="Start date" />
          <Input type="date" className="w-44" value={end} onChange={e => setEnd(e.target.value)} aria-label="End date" />
          <Button className="rounded-full" onClick={addEnrollment}>Add course</Button>
        </div>
      </div>
      {data?.enr.map(e => <EnrollmentCard key={e.id} e={e} tasks={data.tasks.filter(t => t.enrollment_id === e.id)} onChange={refresh} />)}
    </div>
  );
}

function EnrollmentCard({ e, tasks, onChange }: { e: Enrollment; tasks: Task[]; onChange: () => void }) {
  const [progress, setProgress] = useState(e.progress);
  const [kind, setKind] = useState("assessment"); const [title, setTitle] = useState(""); const [due, setDue] = useState("");
  const save = async (patch: Partial<Enrollment>) => { await supabase.from("enrollments").update(patch).eq("id", e.id); onChange(); };
  const addTask = async () => {
    if (!title || !due) return;
    await supabase.from("course_tasks").insert({ enrollment_id: e.id, kind, title, due_at: new Date(due).toISOString() });
    setTitle(""); setDue(""); onChange();
  };
  const updateTask = async (id: string, patch: Partial<Task>) => { await supabase.from("course_tasks").update(patch).eq("id", id); onChange(); };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-2xl text-primary">{courseTitle(e.course_slug)}</h3>
        <div className="flex items-center gap-2">
          <select className={sel} value={e.status} onChange={ev => void save({ status: ev.target.value })}>
            {["active", "completed", "withdrawn"].map(s => <option key={s}>{s}</option>)}
          </select>
          <Button variant="ghost" size="icon" aria-label="Remove course" onClick={async () => { await supabase.from("enrollments").delete().eq("id", e.id); onChange(); }}><Trash2 /></Button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-sm">Progress</span>
        <input type="range" min={0} max={100} step={5} value={progress} onChange={ev => setProgress(Number(ev.target.value))} onPointerUp={() => void save({ progress })} className="flex-1 accent-brand-gold" />
        <span className="w-12 text-right font-medium">{progress}%</span>
      </div>
      <ul className="mt-5 divide-y divide-border">{tasks.map(t => (
        <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
          <span className="w-24 text-xs uppercase tracking-wider text-muted-foreground">{t.kind}</span>
          <span className="flex-1">{t.title} · {new Date(t.due_at).toLocaleString("en-SG")}</span>
          <select className={sel} value={t.status} onChange={ev => void updateTask(t.id, { status: ev.target.value })}>{["upcoming", "done", "missed"].map(s => <option key={s}>{s}</option>)}</select>
          <Input className="w-36" placeholder="Result" defaultValue={t.result ?? ""} onBlur={ev => ev.target.value !== (t.result ?? "") && void updateTask(t.id, { result: ev.target.value || null })} />
          <Button variant="ghost" size="icon" aria-label="Delete" onClick={async () => { await supabase.from("course_tasks").delete().eq("id", t.id); onChange(); }}><Trash2 /></Button>
        </li>
      ))}</ul>
      <div className="mt-4 flex flex-wrap gap-3">
        <select className={sel} value={kind} onChange={ev => setKind(ev.target.value)}>{["assessment", "deadline", "class"].map(k => <option key={k}>{k}</option>)}</select>
        <Input className="min-w-56 flex-1" placeholder="e.g. Practical assessment" value={title} onChange={ev => setTitle(ev.target.value)} />
        <Input type="datetime-local" className="w-56" value={due} onChange={ev => setDue(ev.target.value)} />
        <Button variant="outline" className="rounded-full" onClick={addTask}>Add item</Button>
      </div>
    </div>
  );
}

type Application = { id: string; course_slug: string; full_name: string; email: string; phone: string; citizenship: string | null; preferred_intake: string | null; message: string | null; status: string; created_at: string };

function Applications() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => ((await supabase.from("course_applications").select("*").order("created_at", { ascending: false }).limit(200)).data ?? []) as Application[],
  });
  const setStatus = async (id: string, status: string) => { await supabase.from("course_applications").update({ status }).eq("id", id); void qc.invalidateQueries({ queryKey: ["admin-applications"] }); };
  return (
    <div className="mt-14">
      <h2 className="font-serif text-4xl text-primary">Course applications ({data.filter(a => a.status === "new").length} new)</h2>
      {data.length === 0 ? <p className="mt-3 text-muted-foreground">No applications yet.</p> : (
        <div className="mt-5 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted"><tr>{["Date", "Name", "Contact", "Course", "Intake / notes", "Status"].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{data.map(a => (
              <tr key={a.id} className="border-t border-border align-top">
                <td className="p-3 whitespace-nowrap">{new Date(a.created_at).toLocaleDateString("en-SG")}</td>
                <td className="p-3">{a.full_name}<div className="text-xs text-muted-foreground">{a.citizenship?.replace(/_/g, " ")}</div></td>
                <td className="p-3"><a className="underline" href={`mailto:${a.email}`}>{a.email}</a><div>{a.phone}</div></td>
                <td className="p-3">{courseTitle(a.course_slug)}</td>
                <td className="p-3 max-w-64">{a.preferred_intake}<div className="text-xs text-muted-foreground">{a.message}</div></td>
                <td className="p-3"><select className={sel} value={a.status} onChange={e => void setStatus(a.id, e.target.value)}>{["new", "contacted", "enrolled", "closed"].map(s => <option key={s}>{s}</option>)}</select></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
