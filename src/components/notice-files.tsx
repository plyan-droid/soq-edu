import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type NoticeFile = { path: string; name: string; size: number };
const BUCKET = "notice-files";
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export function asFiles(v: unknown): NoticeFile[] {
  return Array.isArray(v) ? (v as NoticeFile[]).filter(f => f && typeof f.path === "string") : [];
}

export async function uploadNoticeFiles(slug: string, files: File[]): Promise<NoticeFile[]> {
  const out: NoticeFile[] = [];
  for (const file of files) {
    if (file.size > 20 * 1048576) { toast.error(`${file.name} is over 20 MB`); continue; }
    const path = `${slug}/${crypto.randomUUID()}-${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file);
    if (error) { toast.error(`Couldn't upload ${file.name}`); continue; }
    out.push({ path, name: file.name, size: file.size });
  }
  return out;
}

export async function removeNoticeFiles(files: NoticeFile[]) {
  if (files.length) await supabase.storage.from(BUCKET).remove(files.map(f => f.path));
}

async function open(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  if (error || !data) return void toast.error("Couldn't open file");
  window.open(data.signedUrl, "_blank", "noopener");
}

export function NoticeFileList({ files, onRemove }: { files: NoticeFile[]; onRemove?: (f: NoticeFile) => void }) {
  if (!files.length) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {files.map(f => (
        <li key={f.path} className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs">
          <Paperclip className="size-3 shrink-0" />
          <button type="button" className="truncate text-primary underline" onClick={() => void open(f.path)}>{f.name}</button>
          <span className="shrink-0 text-muted-foreground">{kb(f.size)}</span>
          {onRemove && <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onRemove(f)}><X className="size-3" /></button>}
        </li>
      ))}
    </ul>
  );
}

export function PendingFiles({ files, onChange }: { files: File[]; onChange: (f: File[]) => void }) {
  return (
    <div>
      <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-primary underline">
        <Paperclip className="size-3" /> Attach files
        <input type="file" multiple className="sr-only" onChange={e => { onChange([...files, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }} />
      </label>
      {files.length > 0 && <ul className="mt-1 flex flex-wrap gap-2">{files.map((f, i) => (
        <li key={i} className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-0.5 text-xs">{f.name} <span className="text-muted-foreground">{kb(f.size)}</span>
          <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}><X className="size-3" /></button></li>
      ))}</ul>}
    </div>
  );
}
