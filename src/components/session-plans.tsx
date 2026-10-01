import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fmtDateTime } from "@/lib/learning";
import { courses } from "@/lib/site-content";

export type SessionPlan = { id: string; session_id: string; trainer_id: string; objectives: string; activities: string; materials: string; assessment: string; status: string; staff_note: string | null; updated_at: string };
type Session = { id: string; title: string; course_slug: string; starts_at: string; duration_min: number; status: string };

const courseName = (s: string) => courses.find(c => c.slug === s)?.title ?? s;
export const planStatus: Record<string, string> = { draft: "Draft", submitted: "Waiting for review", approved: "Approved", changes: "Changes requested" };
const badge = (s?: string) => `rounded-full px-2 py-0.5 text-xs ${s === "approved" ? "bg-brand-gold/25 text-primary" : s === "changes" ? "bg-destructive/15 text-destructive" : "bg-secondary text-muted-foreground"}`;
const FIELDS = [["objectives", "Learning objectives", "What will learners be able to do by the end?"], ["activities", "Activities & timing", "e.g. 10 min recap · 30 min demo · 20 min practice"], ["materials", "Materials & equipment", "Slides, kits, handouts, links"], ["assessment", "How you'll check learning", "Quiz, practical check, Q&A"]] as const;

/** Trainer: write or edit the plan for one session. */
export function SessionPlanEditor({ session, plan, userId, onDone }: { session: Session; plan?: SessionPlan | undefined; userId: string; onDone: () => void }) {
  const [f, setF] = useState({ objectives: plan?.objectives ?? "", activities: plan?.activities ?? "", materials: plan?.materials ?? "", assessment: plan?.assessment ?? "" });
  const save = async (status: "draft" | "submitted") => {
    if (status === "submitted" && (!f.objectives.trim() || !f.activities.trim())) return void toast.error("Add objectives and activities before submitting.");
    const { error } = plan
      ? await supabase.from("session_plans").update({ ...f, status }).eq("id", plan.id)
      : await supabase.from("session_plans").insert({ ...f, status, session_id: session.id, trainer_id: userId });
    if (error) return void toast.error(error.message);
    toast.success(status === "submitted" ? "Plan sent to SOQ staff" : "Draft saved"); onDone();
  };
  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-background p-4">
      {plan?.staff_note && <p className="rounded-md bg-secondary p-2 text-sm"><b>Staff note:</b> {plan.staff_note}</p>}
      {FIELDS.map(([k, label, ph]) => (
        <label key={k} className="block text-sm font-medium">{label}
          <Textarea className="mt-1 font-normal" rows={3} placeholder={ph} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />
        </label>))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" className="rounded-full" onClick={() => void save("draft")}>Save draft</Button>
        <Button className="rounded-full" onClick={() => void save("submitted")}>Submit plan</Button>
        <Button variant="ghost" className="rounded-full" onClick={onDone}>Close</Button>
      </div>
    </div>
  );
}

/** Trainer: every upcoming class with its plan status. */
export function TrainerSessionPlans({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const { data: sessions = [] } = useQuery({ queryKey: ["t-plan-sessions", userId], queryFn: async () => ((await supabase.from("live_sessions").select("id,title,course_slug,starts_at,duration_min,status").eq("trainer_id", userId).neq("status", "cancelled").gte("starts_at", new Date(Date.now() - 864e5).toISOString()).order("starts_at")).data ?? []) as Session[] });
  const { data: plans = [] } = useQuery({ queryKey: ["t-plans", userId], queryFn: async () => ((await supabase.from("session_plans").select("*").eq("trainer_id", userId)).data ?? []) as SessionPlan[] });
  const planFor = (id: string) => plans.find(p => p.session_id === id);
  const missing = sessions.filter(s => !planFor(s.id)).length;
  return (
    <div className="mt-6">
      <p className="text-muted-foreground">Write a short plan for each upcoming class and submit it. SOQ staff review it and may leave a note.{missing > 0 && <b className="text-primary"> {missing} class{missing === 1 ? "" : "es"} still need a plan.</b>}</p>
      {sessions.length === 0 ? <p className="mt-6 text-muted-foreground">No upcoming classes. Schedule one under Live classes or Calendar view first.</p> : (
        <ul className="mt-5 space-y-3">{sessions.map(s => { const p = planFor(s.id); return (
          <li key={s.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{courseName(s.course_slug)} · {fmtDateTime(s.starts_at)} · {s.duration_min} min</p></div>
              <div className="flex items-center gap-3"><span className={badge(p?.status)}>{p ? planStatus[p.status] : "No plan yet"}</span>
                <Button size="sm" variant={p ? "outline" : "default"} className="rounded-full" onClick={() => setOpen(open === s.id ? null : s.id)}>{p ? (p.status === "approved" ? "View / edit" : "Edit plan") : "Write plan"}</Button></div>
            </div>
            {open === s.id && <SessionPlanEditor session={s} plan={p} userId={userId} onDone={() => { setOpen(null); void qc.invalidateQueries({ queryKey: ["t-plans", userId] }); }} />}
          </li>); })}</ul>)}
    </div>
  );
}

/** Staff: review submitted session plans. */
export function StaffSessionPlans() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("submitted");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { data = [] } = useQuery({ queryKey: ["staff-plans"], queryFn: async () => ((await supabase.from("session_plans").select("*, live_sessions(id,title,course_slug,starts_at,duration_min,status)").order("updated_at", { ascending: false }).limit(200)).data ?? []) as unknown as (SessionPlan & { live_sessions: Session | null })[] });
  const { data: names = {} } = useQuery({ queryKey: ["staff-plan-trainers", data.map(d => d.trainer_id).join()], enabled: data.length > 0, queryFn: async () => Object.fromEntries((((await supabase.from("profiles").select("id,full_name,email").in("id", [...new Set(data.map(d => d.trainer_id))])).data) ?? []).map(p => [p.id, p.full_name || p.email])) as Record<string, string> });
  const review = async (id: string, status: "approved" | "changes") => {
    const { error } = await supabase.from("session_plans").update({ status, staff_note: notes[id]?.trim() || null }).eq("id", id);
    if (error) return void toast.error(error.message);
    toast.success(status === "approved" ? "Plan approved" : "Sent back to trainer"); void qc.invalidateQueries({ queryKey: ["staff-plans"] });
  };
  const shown = data.filter(p => filter === "all" || p.status === filter);
  return (
    <div>
      <h3 className="mt-10 font-serif text-2xl text-primary">Session plans</h3>
      <div className="mt-3 flex flex-wrap gap-2">{([["submitted", "Waiting for review"], ["changes", "Changes requested"], ["approved", "Approved"], ["all", "All"]] as const).map(([k, l]) => (
        <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} className="rounded-full" onClick={() => setFilter(k)}>{l} ({k === "all" ? data.length : data.filter(p => p.status === k).length})</Button>))}</div>
      {shown.length === 0 ? <p className="mt-3 text-muted-foreground">No plans here.</p> : (
        <ul className="mt-4 space-y-3">{shown.map(p => (
          <li key={p.id} className="rounded-lg border border-border bg-card p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-medium">{p.live_sessions?.title ?? "Class"}</p><p className="text-xs text-muted-foreground">{names[p.trainer_id] ?? "Trainer"} · {p.live_sessions ? `${courseName(p.live_sessions.course_slug)} · ${fmtDateTime(p.live_sessions.starts_at)}` : ""}</p></div><span className={badge(p.status)}>{planStatus[p.status]}</span></div>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">{FIELDS.map(([k, label]) => <div key={k}><dt className="text-xs font-medium text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap">{p[k] || "—"}</dd></div>)}</dl>
            {p.status !== "draft" && <div className="mt-3 flex flex-wrap gap-2">
              <input className="h-9 min-w-56 flex-1 rounded-md border border-input bg-background px-3" placeholder="Note to trainer (optional)" defaultValue={p.staff_note ?? ""} onChange={e => setNotes({ ...notes, [p.id]: e.target.value })} />
              <Button size="sm" className="rounded-full" onClick={() => void review(p.id, "approved")}>Approve</Button>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => void review(p.id, "changes")}>Ask for changes</Button>
            </div>}
          </li>))}</ul>)}
    </div>
  );
}
