import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AssignmentFileList, assignmentFiles } from "@/components/assignment-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type MarkableSubmission = { id: string; student_name: string; body: string; link: string | null; files: unknown; score: number | null; feedback: string | null; status: string };
export function AssignmentMarking({ submission: s, max, slug, trainerId }: { submission: MarkableSubmission; max: number; slug: string; trainerId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<{ score: string; feedback: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const { data: draft } = useQuery({ queryKey: ["mark-draft", s.id], queryFn: async () => {
    const { data, error } = await supabase.from("assignment_mark_drafts").select("score,feedback").eq("submission_id", s.id).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const values = form ?? { score: draft?.score?.toString() ?? s.score?.toString() ?? "", feedback: draft?.feedback ?? s.feedback ?? "" };
  const valid = values.score === "" || (Number.isInteger(Number(values.score)) && Number(values.score) >= 0 && Number(values.score) <= max);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["mark-draft", s.id] }); void qc.invalidateQueries({ queryKey: ["t-asg", slug] }); void qc.invalidateQueries({ queryKey: ["s-asg", slug] }); void qc.invalidateQueries({ queryKey: ["learn", slug] }); };
  const save = async (returnWork: boolean) => {
    if (!valid || (returnWork && values.score === "")) return void toast.error(`Enter a mark between 0 and ${max}`);
    setBusy(true);
    const result = returnWork
      ? await supabase.from("assignment_submissions").update({ score: Number(values.score), feedback: values.feedback.trim(), status: "graded" }).eq("id", s.id)
      : await supabase.from("assignment_mark_drafts").upsert({ submission_id: s.id, trainer_id: trainerId, score: values.score === "" ? null : Number(values.score), feedback: values.feedback.trim() });
    if (!result.error && returnWork) await supabase.from("assignment_mark_drafts").delete().eq("submission_id", s.id);
    setBusy(false);
    if (result.error) return void toast.error(returnWork ? "Couldn't return work" : "Couldn't save draft");
    toast.success(returnWork ? "Work returned to learner" : "Mark saved privately"); setForm(null); refresh();
  };
  return <div className="space-y-3">
    {s.body ? <p className="whitespace-pre-line rounded bg-muted/50 p-3 text-sm">{s.body}</p> : <p className="text-xs text-muted-foreground">No written answer.</p>}
    {s.link && /^https?:\/\//i.test(s.link) && <a href={s.link} target="_blank" rel="noreferrer" className="text-sm text-primary underline">Open submitted link</a>}
    <AssignmentFileList files={assignmentFiles(s.files)} />
    <p className="text-xs text-muted-foreground">{s.status === "graded" ? "Returned" : draft ? "Draft mark saved · not visible to learner" : "Handed in · awaiting mark"}</p>
    <div className="flex items-center gap-2"><Input className="w-24" type="number" min={0} max={max} aria-label={`Mark for ${s.student_name}`} placeholder="Mark" value={values.score} onChange={e => setForm({ ...values, score: e.target.value })} /><span className="text-sm text-muted-foreground">/ {max}</span></div>
    <Textarea aria-label={`Feedback for ${s.student_name}`} placeholder="Feedback for the learner" value={values.feedback} onChange={e => setForm({ ...values, feedback: e.target.value })} />
    <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy || !valid} onClick={() => void save(false)}>Save draft</Button><Button size="sm" disabled={busy || !valid || values.score === ""} onClick={() => void save(true)}>{s.status === "graded" ? "Update returned work" : "Return to learner"}</Button></div>
  </div>;
}