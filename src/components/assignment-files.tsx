import { FileAudio, FileText, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export type AssignmentFile = { path: string; name: string; size: number };
const bucket = "assignment-work";
const supported = ["application/pdf", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/ogg"];
export function assignmentFiles(value: unknown): AssignmentFile[] {
  return Array.isArray(value) ? value.filter((f): f is AssignmentFile => !!f && typeof f.path === "string" && typeof f.name === "string") : [];
}
export async function uploadAssignmentFiles(slug: string, userId: string, assignmentId: string, files: File[]) {
  const uploaded: AssignmentFile[] = [];
  try {
    for (const file of files) {
      if (file.size > 20 * 1048576 || !supported.includes(file.type)) throw new Error("Only PDF or audio files up to 20 MB are accepted");
      const path = `${slug}/${userId}/${assignmentId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
      if (error) throw error;
      uploaded.push({ path, name: file.name, size: file.size });
    }
    return uploaded;
  } catch (error) {
    await removeAssignmentFiles(uploaded);
    throw error;
  }
}
export async function removeAssignmentFiles(files: AssignmentFile[]) {
  if (files.length) await supabase.storage.from(bucket).remove(files.map(f => f.path));
}
export function AssignmentFileList({ files, onRemove }: { files: AssignmentFile[]; onRemove?: (file: AssignmentFile) => void }) {
  if (!files.length) return null;
  const open = async (file: AssignmentFile) => {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(file.path, 300);
    if (error || !data) return void toast.error("Couldn't open the file");
    window.open(data.signedUrl, "_blank", "noopener");
  };
  return <ul className="mt-3 flex flex-wrap gap-2">{files.map(file => <li key={file.path} className="flex max-w-full items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm">
    {file.name.toLowerCase().endsWith(".pdf") ? <FileText className="size-4 shrink-0 text-primary" /> : <FileAudio className="size-4 shrink-0 text-primary" />}
    <Button variant="link" className="h-auto min-w-0 truncate p-0" onClick={() => void open(file)}>{file.name}</Button>
    <span className="text-xs text-muted-foreground">{Math.ceil(file.size / 1024)} KB</span>
    {onRemove && <Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => onRemove(file)}><X className="size-4" /></Button>}
  </li>)}</ul>;
}
export function AssignmentFilePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  return <div className="space-y-2"><label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary underline"><Paperclip className="size-4" /> Attach PDF or audio
    <input className="sr-only" type="file" accept=".pdf,.mp3,.wav,.m4a,.ogg,audio/*,application/pdf" multiple onChange={e => { onChange([...files, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
  </label>{files.length > 0 && <div className="flex flex-wrap gap-2">{files.map((file, i) => <span key={`${file.name}-${i}`} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs">{file.name}<Button variant="ghost" size="icon-sm" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, j) => i !== j))}><X className="size-3" /></Button></span>)}</div>}</div>;
}