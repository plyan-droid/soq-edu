import { useState } from "react";
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

const card = "rounded-lg border border-border bg-card p-5";

export function CourseNoticesList({ slug }: { slug: string }) {
  const { data = [] } = useQuery({ queryKey: ["notices", slug], queryFn: async () => (await supabase.from("course_notices").select("*").eq("course_slug", slug).order("created_at", { ascending: false }).limit(5)).data ?? [] });
  if (data.length === 0) return null;
  return <div className="mb-6 space-y-2">{data.map(n => (
    <div key={n.id} className={`rounded-md border-l-4 p-4 ${noticeColor[n.color]}`}><p className="flex items-center gap-2 font-semibold"><Megaphone className="size-4" />{n.title}</p>{n.body && <p className="mt-1 whitespace-pre-line text-sm">{n.body}</p>}</div>
  ))}</div>;
}

export function StudentQuizzes({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const [ans, setAns] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ score: number; passed: boolean; certificate: string | null; right: number; total: number } | null>(null);
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["s-quizzes", slug, user?.id], queryFn: async () => (await supabase.from("quizzes").select("*, quiz_questions(id, prompt, options, position), quiz_attempts(score, passed, certificate_code, created_at)").eq("course_slug", slug).order("created_at")).data ?? [] });
  if (!user || data.length === 0) return null;
  const submit = async (id: string) => {
    const { data: r, error } = await supabase.rpc("submit_quiz", { _quiz: id, _answers: ans });
    if (error) { toast.error(error.message); return; }
    setResult(r as never); void qc.invalidateQueries({ queryKey: ["s-quizzes", slug] });
  };
  return (
    <div className={card}>
      <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Trophy className="size-5" /> Quizzes</h3>
      <ul className="mt-3 space-y-3">{data.map(q => {
        const tries = (q.quiz_attempts ?? []).filter(Boolean) as { score: number; passed: boolean; certificate_code: string | null }[];
        const best = tries.reduce((m, t) => Math.max(m, t.score), -1);
        const cert = tries.find(t => t.certificate_code)?.certificate_code;
        const qs = [...(q.quiz_questions ?? [])].sort((a, b) => a.position - b.position);
        return <li key={q.id} className="text-sm">
          <div className="flex items-center justify-between gap-2"><span className="font-medium">{q.title}</span>
            <Button size="sm" variant="outline" onClick={() => { setOpen(open === q.id ? null : q.id); setAns({}); setResult(null); }}>{open === q.id ? "Close" : best >= 0 ? "Try again" : "Start"}</Button></div>
          <p className="text-xs text-muted-foreground">Pass mark {q.pass_mark}%{best >= 0 && ` · best ${best}%`}{cert && <> · <Link to="/verify-certificate" className="underline">Certificate {cert}</Link></>}</p>
          {open === q.id && (
            <div className="mt-3 space-y-4 rounded-md bg-muted/50 p-3">
              {result ? (
                <div><p className="text-lg font-semibold">{result.passed ? "You passed!" : "Not quite."} {result.score}% ({result.right}/{result.total})</p>
                  {result.certificate && <p className="mt-1">Your certificate code is <b>{result.certificate}</b>. Anyone can check it on the <Link to="/verify-certificate" className="underline">certificate check page</Link>.</p>}</div>
              ) : <>
                {qs.map((qq, i) => (
                  <fieldset key={qq.id}><legend className="font-medium">{i + 1}. {qq.prompt}</legend>
                    {qq.options.map((o, k) => <label key={k} className="mt-1 flex items-center gap-2"><input type="radio" name={qq.id} checked={ans[qq.id] === k} onChange={() => setAns({ ...ans, [qq.id]: k })} />{o}</label>)}</fieldset>
                ))}
                <Button className="rounded-full" disabled={Object.keys(ans).length < qs.length} onClick={() => void submit(q.id)}>Submit answers</Button>
              </>}
            </div>
          )}
        </li>;
      })}</ul>
    </div>
  );
}

export function StudentAssignments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Record<string, { body: string; link: string }>>({});
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["s-asg", slug, user?.id], queryFn: async () => (await supabase.from("assignments").select("*, assignment_submissions(*)").eq("course_slug", slug).order("due_at", { nullsFirst: false })).data ?? [] });
  if (!user || data.length === 0) return null;
  const submit = async (id: string) => {
    const v = f[id]; if (!v || (!v.body.trim() && !v.link.trim())) { toast.error("Write an answer or add a link to your file"); return; }
    const name = (user.user_metadata?.["full_name"] as string) || user.email || "Student";
    const { error } = await supabase.from("assignment_submissions").insert({ assignment_id: id, student_id: user.id, student_name: name, body: v.body.trim(), link: v.link.trim() || null });
    if (error) { toast.error("Couldn't submit"); return; }
    toast.success("Submitted"); void qc.invalidateQueries({ queryKey: ["s-asg", slug] });
  };
  return (
    <div className={card}>
      <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><ClipboardList className="size-5" /> Assignments</h3>
      <ul className="mt-3 space-y-4">{data.map(a => {
        const mine = (a.assignment_submissions ?? []).find(s => s.student_id === user.id);
        const v = f[a.id] ?? { body: "", link: "" };
        return <li key={a.id} className="text-sm">
          <p className="font-medium">{a.title}</p>
          <p className="text-xs text-muted-foreground">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"}</p>
          {a.instructions && <p className="mt-1 whitespace-pre-line">{a.instructions}</p>}
          {mine ? (
            <p className="mt-2 rounded-md bg-muted/50 p-2">{mine.status === "graded" ? <>Grade: <b>{mine.score}/{a.max_score}</b>{mine.feedback && ` — ${mine.feedback}`}</> : "Submitted. Waiting for your trainer to grade it."}</p>
          ) : (
            <div className="mt-2 space-y-2"><Textarea placeholder="Your answer" value={v.body} onChange={e => setF({ ...f, [a.id]: { ...v, body: e.target.value } })} maxLength={10000} />
              <Input placeholder="Link to your file (Google Drive, OneDrive…)" value={v.link} onChange={e => setF({ ...f, [a.id]: { ...v, link: e.target.value } })} maxLength={500} />
              <Button size="sm" className="rounded-full" onClick={() => void submit(a.id)}>Submit</Button></div>
          )}
        </li>;
      })}</ul>
    </div>
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
