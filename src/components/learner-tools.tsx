import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, ClipboardList, Megaphone, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/learning";
import { noticeColor } from "@/components/trainer-tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NoticeFileList, asFiles } from "@/components/notice-files";
import { NoticeBody } from "@/components/notice-body";
import { AssignmentFileList, AssignmentFilePicker, assignmentFiles, uploadAssignmentFiles, removeAssignmentFiles } from "@/components/assignment-files";

export function CourseNoticesList({ slug, pinnedOnly = false, unpinnedOnly = false }: { slug: string; pinnedOnly?: boolean; unpinnedOnly?: boolean }) {
  const { data = [] } = useQuery({ queryKey: ["notices", slug], queryFn: async () => (await supabase.from("course_notices").select("*").eq("course_slug", slug).order("created_at", { ascending: false })).data ?? [] });
  const visible = data.filter(n => pinnedOnly ? n.pinned : unpinnedOnly ? !n.pinned : true);
  if (visible.length === 0) return null;
  return <div className="mb-4 space-y-3">{[...visible].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(n => (
    <div key={n.id} className={pinnedOnly ? "rounded-md border border-brand-gold bg-card p-5 sm:p-6" : `rounded-md border-l-4 p-4 ${noticeColor[n.color]}`}><p className="flex items-center gap-2 text-sm font-medium text-primary"><Megaphone className="size-4 text-brand-gold" />{n.pinned && <span>Pinned · Trainer announcement</span>}</p><h2 className="mt-4 font-serif text-2xl leading-tight text-primary">{n.title}</h2>{n.body && <NoticeBody text={n.body} className="mt-3 text-sm leading-6" />}<NoticeFileList files={asFiles((n as { attachments?: unknown }).attachments)} /></div>
  ))}</div>;
}

export function StudentQuizzes({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { const sync = () => { const id = window.location.hash.match(/^#quiz-(.+)$/)?.[1]; if (id) setOpen(id); }; sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  const [ans, setAns] = useState<Record<string, number | string>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; certificate: string | null; right: number; total: number } | null>(null);
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["s-quizzes", slug, user?.id], queryFn: async () => (await supabase.from("quizzes").select("*, quiz_questions(id, prompt, options, position, kind), quiz_attempts(score, passed, certificate_code, created_at)").eq("course_slug", slug).order("created_at")).data ?? [] });
  if (!user || data.length === 0) return null;
  const submit = async (id: string) => {
    const { data: r, error } = await supabase.rpc("submit_quiz", { _quiz: id, _answers: ans });
    if (error) { toast.error(error.message); return; }
    setResult(r as never); void qc.invalidateQueries({ queryKey: ["s-quizzes", slug] });
  };
  return (
    <section aria-label="Quizzes">
      <h3 className="border-b border-border pb-3 font-serif text-2xl text-primary">Quizzes</h3>
      <ul className="divide-y divide-border">{data.map(q => {
        const tries = (q.quiz_attempts ?? []).filter(Boolean) as { score: number; passed: boolean; certificate_code: string | null }[];
        const best = tries.reduce((m, t) => Math.max(m, t.score), -1);
        const cert = tries.find(t => t.certificate_code)?.certificate_code;
        const qs = [...(q.quiz_questions ?? [])].sort((a, b) => a.position - b.position);
        return <li key={q.id} id={`quiz-${q.id}`} className="scroll-mt-24 py-4 text-sm">
          <div className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-3 font-medium"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Trophy className="size-4" /></span>{q.title}</span>
            <Button size="sm" variant="outline" onClick={() => { setOpen(open === q.id ? null : q.id); setAns({}); setResult(null); }}>{open === q.id ? "Close" : best >= 0 ? "Try again" : "Start"}</Button></div>
          <p className="ml-12 text-xs text-muted-foreground">Pass mark {q.pass_mark}%{best >= 0 && ` · best ${best}%`}{cert && <> · <Link to="/verify-certificate" className="underline">Certificate {cert}</Link></>}</p>
          {open === q.id && (
            <div className="mt-3 space-y-4 rounded-md bg-muted/50 p-3">
              {result ? (
                <div><p className="text-lg font-semibold">{result.passed ? "You passed!" : "Not quite."} {result.score}% ({result.right}/{result.total})</p>
                  {result.certificate && <p className="mt-1">Your certificate code is <b>{result.certificate}</b>. Anyone can check it on the <Link to="/verify-certificate" className="underline">certificate check page</Link>.</p>}</div>
              ) : <>
                {qs.map((qq, i) => (
                  <fieldset key={qq.id}><legend className="font-medium">{i + 1}. {qq.prompt}</legend>
                    {qq.kind === "short" ? <input className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3" placeholder="Type your answer" value={(ans[qq.id] as string) ?? ""} onChange={e => setAns({ ...ans, [qq.id]: e.target.value })} /> : qq.options.map((o, k) => <label key={k} className="mt-1 flex items-center gap-2"><input type="radio" name={qq.id} checked={ans[qq.id] === k} onChange={() => setAns({ ...ans, [qq.id]: k })} />{o}</label>)}</fieldset>
                ))}
                <Button className="rounded-full" disabled={qs.some(x => ans[x.id] === undefined || ans[x.id] === "")} onClick={() => void submit(q.id)}>Submit answers</Button>
              </>}
            </div>
          )}
        </li>;
      })}</ul>
    </section>
  );
}

export function StudentAssignments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, { body: string; link: string }>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { const sync = () => { const id = window.location.hash.match(/^#assignment-(.+)$/)?.[1]; if (id) setOpen(id); }; sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync); }, []);
  const [saving, setSaving] = useState(false);
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["s-asg", slug, user?.id], queryFn: async () => (await supabase.from("assignments").select("*, assignment_submissions(*)").eq("course_slug", slug).order("due_at", { nullsFirst: false })).data ?? [] });
  if (!user || data.length === 0) return null;
  const submit = async (id: string) => {
    const v = f[id] ?? { body: "", link: "" }; if (!v.body.trim() && !v.link.trim() && !files[id]?.length) { toast.error("Write an answer or attach a file"); return; }
    if (v.link.trim() && !/^https?:\/\//i.test(v.link.trim())) { toast.error("Use a full https:// link for your file"); return; }
    if (saving) return;
    setSaving(true);
    const name = (user.user_metadata?.["full_name"] as string) || user.email || "Student";
    let uploaded: Awaited<ReturnType<typeof uploadAssignmentFiles>> = [];
    try { uploaded = await uploadAssignmentFiles(slug, user.id, id, files[id] ?? []); } catch (e) { setSaving(false); toast.error(e instanceof Error ? e.message : "Couldn't upload files"); return; }
    const { error } = await supabase.from("assignment_submissions").insert({ assignment_id: id, student_id: user.id, student_name: name, body: v.body.trim(), link: v.link.trim() || null, files: uploaded });
    setSaving(false);
    if (error) { await removeAssignmentFiles(uploaded); toast.error("Couldn't submit"); return; }
    toast.success("Handed in"); setFiles(p => ({ ...p, [id]: [] })); setOpen(null); void qc.invalidateQueries({ queryKey: ["s-asg", slug] }); void qc.invalidateQueries({ queryKey: ["learn", slug] }); void qc.invalidateQueries({ queryKey: ["t-asg", slug] });
  };
  return (
    <section aria-label="Assignments">
      <h3 className="border-b border-border pb-3 font-serif text-2xl text-primary">Assignments</h3>
      <ul className="divide-y divide-border">{data.map(a => {
        const mine = (a.assignment_submissions ?? []).find(s => s.student_id === user.id);
        const v = f[a.id] ?? { body: "", link: "" };
        return <li key={a.id} id={`assignment-${a.id}`} className="scroll-mt-24 py-3 text-sm">
          <Button variant="ghost" className="h-auto min-h-12 w-full justify-start gap-3 whitespace-normal px-2 py-2 text-left" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><ClipboardList className="size-4" /></span><span className="min-w-0 flex-1 font-medium">{a.title}<span className="mt-0.5 block text-xs font-normal text-muted-foreground">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"} · {a.max_score} marks</span></span><span className="shrink-0 text-xs text-muted-foreground">{mine ? mine.status === "graded" ? "Returned" : mine.status === "marked" ? "Being marked" : "Handed in" : a.due_at && new Date(a.due_at) < new Date() ? "Overdue" : "To do"}</span></Button>
          {open === a.id && <div className="mt-3 space-y-3 border-t border-border pt-3">
            {a.instructions && <p className="whitespace-pre-line">{a.instructions}</p>}
            {mine ? <div className="rounded-md bg-muted/50 p-3"><p className="font-medium">{mine.status === "graded" ? `Returned: ${mine.score}/${a.max_score}` : mine.status === "marked" ? "Being marked" : "Handed in · waiting for marking"}</p>{mine.body && <p className="mt-2 whitespace-pre-line">{mine.body}</p>}{mine.link && <a href={mine.link} target="_blank" rel="noreferrer" className="mt-2 block text-primary underline">Your submitted link</a>}<AssignmentFileList files={assignmentFiles(mine.files)} />{mine.status === "graded" && mine.feedback && <p className="mt-2 whitespace-pre-line"><b>Trainer feedback:</b> {mine.feedback}</p>}</div>
            : <div className="space-y-2"><Textarea aria-label={`Answer for ${a.title}`} placeholder="Your answer" value={v.body} onChange={e => setF({ ...f, [a.id]: { ...v, body: e.target.value } })} maxLength={10000} /><Input aria-label={`File link for ${a.title}`} placeholder="File link (Google Drive, OneDrive…)" value={v.link} onChange={e => setF({ ...f, [a.id]: { ...v, link: e.target.value } })} maxLength={500} /><AssignmentFilePicker files={files[a.id] ?? []} onChange={next => setFiles(p => ({ ...p, [a.id]: next }))} /><Button size="sm" disabled={saving || (!v.body.trim() && !v.link.trim() && !files[a.id]?.length)} onClick={() => void submit(a.id)}>Hand in assignment</Button></div>}
          </div>}
        </li>;
      })}</ul>
    </section>
  );
}

export function NotifyMe({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: on = false } = useQuery({ enabled: !!user, queryKey: ["follow", slug, user?.id], queryFn: async () => !!(await supabase.from("course_follows").select("course_slug").eq("user_id", user!.id).eq("course_slug", slug).maybeSingle()).data });
  const toggle = async () => {
    if (!user) return;
    if (on) await supabase.from("course_follows").delete().eq("user_id", user.id).eq("course_slug", slug);
    else await supabase.from("course_follows").insert({ user_id: user.id, course_slug: slug });
    toast.success(on ? "You won't get intake updates for this course" : "We'll let you know about new intakes");
    void qc.invalidateQueries({ queryKey: ["follow", slug] });
  };
  if (!user) return <p className="mt-3 text-center text-sm"><Link to="/login" className="inline-flex items-center gap-1 text-primary underline"><Bell className="size-4" /> Log in to get intake updates</Link></p>;
  return <button onClick={() => void toggle()} className="mt-3 flex w-full items-center justify-center gap-2 text-sm text-primary underline underline-offset-4">{on ? <><BellRing className="size-4" /> Following new intakes</> : <><Bell className="size-4" /> Notify me about new intakes</>}</button>;
}

/** Stores ?ref=CODE so the referral is claimed when the visitor signs in. */
export function RefCapture() {
  useEffect(() => { const r = new URLSearchParams(window.location.search).get("ref"); if (r && /^[A-Z0-9]{4,12}$/i.test(r)) localStorage.setItem("soq-ref", r.toUpperCase()); }, []);
  return null;
}

export function JoinWaitlist({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false); const [done, setDone] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const join = async () => {
    if (f.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email) || f.phone.trim().length < 6) return void toast.error("Enter your name, a valid email and your mobile number.");
    const { error } = await supabase.from("course_applications").insert({ course_slug: slug, full_name: f.name.trim().slice(0, 120), email: f.email.trim().slice(0, 200), phone: f.phone.trim().slice(0, 30), status: "waitlist", source: "website", message: "Joined the waitlist" });
    if (error) return void toast.error("Couldn't join the waitlist. Please try again.");
    setDone(true);
  };
  if (done) return <p className="mt-2 text-center text-sm text-primary">You're on the waitlist. SOQ will contact you when a seat opens.</p>;
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2 flex w-full items-center justify-center gap-2 text-sm text-primary underline underline-offset-4"><ClipboardList className="size-4" /> Class full? Join the waitlist</button>;
  return <div className="mt-3 space-y-2 rounded-md border border-border p-3">
    <Input placeholder="Your name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
    <Input placeholder="Email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
    <Input placeholder="Mobile number" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
    <Button className="w-full rounded-full" onClick={() => void join()}>Join waitlist</Button></div>;
}

export function useNotices() {
  return useQuery({ queryKey: ["site-notices-public"], queryFn: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const d = (await supabase.from("site_notices").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false })).data ?? [];
    return d.filter(n => !n.ends_on || n.ends_on >= today);
  } });
}

export function NoticesStrip() {
  const { data = [] } = useNotices();
  if (!data.length) return null;
  return <div className="mx-auto mt-6 max-w-7xl space-y-2 px-5 lg:px-8">{data.slice(0, 3).map(n => <div key={n.id} className="flex gap-3 rounded-md border-l-4 border-brand-gold bg-brand-gold-soft px-4 py-3 text-sm text-primary"><Megaphone className="mt-0.5 size-4 shrink-0" /><div><strong>{n.title}</strong>{n.body && <> — {n.body}</>}</div></div>)}
    <Link to="/noticeboard" className="text-sm underline">All notices</Link></div>;
}

export function MyInstalments({ userId }: { userId: string }) {
  const { data: pays = [] } = useQuery({ queryKey: ["my-bank", userId], queryFn: async () => (await supabase.from("bank_payments").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: inst = [] } = useQuery({ queryKey: ["my-inst", userId], queryFn: async () => (await supabase.from("instalments").select("*").order("due_date")).data ?? [] });
  if (!pays.length) return <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8"><h2 className="font-serif text-3xl text-primary">My payments</h2><p className="mt-3 text-sm text-muted-foreground">No transfers or instalments recorded.</p></section>;
  return <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8"><h2 className="font-serif text-3xl text-primary">My payments</h2>
    <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card text-sm">{pays.map(p => <li key={p.id} className="p-4">
      <div className="flex flex-wrap justify-between gap-2"><span>{(p.items as { title: string }[]).map(i => i.title).join(", ")} · {p.method === "paynow" ? "PayNow" : "Bank transfer"} ref {p.reference}</span>
        <span className="font-medium">${Number(p.total).toFixed(2)} · {p.status === "pending" ? "Waiting for SOQ to confirm" : p.status}</span></div>
      {inst.filter(i => i.payment_id === p.id).length > 0 && <ul className="mt-2 grid gap-1 sm:grid-cols-3">{inst.filter(i => i.payment_id === p.id).map(i => <li key={i.id} className={i.paid ? "text-muted-foreground line-through" : ""}>#{i.seq} · {i.due_date} · ${Number(i.amount).toFixed(2)}{i.paid ? " paid" : ""}</li>)}</ul>}
    </li>)}</ul><Button asChild variant="link" className="mt-4 px-0"><Link to="/student-portal" search={{ tool: "invoices" }}>View invoices →</Link></Button></section>;
}
