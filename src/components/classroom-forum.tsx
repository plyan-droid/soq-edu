import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { User } from "@supabase/supabase-js";

type Thread = { id: string; author_id: string; author_name: string; title: string; body: string; created_at: string };
type Reply = { id: string; thread_id: string; author_id: string; author_name: string; body: string; created_at: string };
const displayName = (user: User) => (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) || user.email?.split("@")[0] || "Member";
const when = (date: string) => new Date(date).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function ClassroomForum({ slug, user, isStaff }: { slug: string; user: User; isStaff: boolean }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ["classroom-threads", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("classroom_threads").select("id,author_id,author_name,title,body,created_at").eq("course_slug", slug).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data as Thread[];
    },
  });
  const { data: replies = [] } = useQuery({
    queryKey: ["classroom-replies", slug], enabled: threads.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("classroom_replies").select("id,thread_id,author_id,author_name,body,created_at").in("thread_id", threads.map(t => t.id)).order("created_at");
      if (error) throw error;
      return data as Reply[];
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["classroom-threads", slug] }); void qc.invalidateQueries({ queryKey: ["classroom-replies", slug] }); };
  const create = async () => {
    if (title.trim().length < 3 || !body.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.from("classroom_threads").insert({ course_slug: slug, author_id: user.id, author_name: displayName(user), title: title.trim(), body: body.trim() });
    setBusy(false);
    if (error) return void toast.error("Couldn't post this discussion");
    setTitle(""); setBody(""); refresh();
  };
  const respond = async (id: string) => {
    const text = reply[id]?.trim(); if (!text || busy) return;
    setBusy(true);
    const { error } = await supabase.from("classroom_replies").insert({ thread_id: id, author_id: user.id, author_name: displayName(user), body: text });
    setBusy(false);
    if (error) return void toast.error("Couldn't post your reply");
    setReply(p => ({ ...p, [id]: "" })); refresh();
  };
  const remove = async (table: "classroom_threads" | "classroom_replies", id: string) => {
    if (!window.confirm("Delete this message?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) return void toast.error("Couldn't delete this message");
    refresh();
  };
  return <div className="mx-auto max-w-3xl space-y-6">
    <div className="space-y-3 border-b border-border pb-6">
      <h2 className="font-serif text-2xl text-primary">Start a discussion</h2>
      <Input aria-label="Discussion title" placeholder="What would you like to discuss?" maxLength={160} value={title} onChange={e => setTitle(e.target.value)} />
      <Textarea aria-label="Discussion message" placeholder="Share a question, idea or resource with your class…" maxLength={5000} value={body} onChange={e => setBody(e.target.value)} />
      <Button onClick={() => void create()} disabled={busy || title.trim().length < 3 || !body.trim()}>Post to class</Button>
    </div>
    {isLoading ? <p className="text-muted-foreground">Loading discussions…</p> : error ? <p className="text-destructive">Couldn't load discussions. Please try again.</p> : threads.length === 0 ? <p className="text-muted-foreground">No discussions yet. Start one for your class.</p> : threads.map(t => <article key={t.id} className="border-b border-border pb-6">
      <div className="flex items-start justify-between gap-3"><div><h3 className="font-serif text-2xl text-primary">{t.title}</h3><p className="text-xs text-muted-foreground">{t.author_name} · {when(t.created_at)}</p></div>
        {(t.author_id === user.id || isStaff) && <Button variant="ghost" size="icon-sm" title="Delete discussion" aria-label="Delete discussion" onClick={() => void remove("classroom_threads", t.id)}><Trash2 /></Button>}
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6">{t.body}</p>
      <div className="mt-5 border-l-2 border-border pl-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground"><MessageCircle className="size-4" />{replies.filter(r => r.thread_id === t.id).length} replies</p>
        {replies.filter(r => r.thread_id === t.id).map(r => <div key={r.id} className="mb-3 text-sm"><div className="flex items-start justify-between gap-2"><p className="whitespace-pre-line">{r.body}</p>{(r.author_id === user.id || isStaff) && <Button variant="ghost" size="icon-sm" title="Delete reply" aria-label="Delete reply" onClick={() => void remove("classroom_replies", r.id)}><Trash2 /></Button>}</div><p className="mt-1 text-xs text-muted-foreground">{r.author_name} · {when(r.created_at)}</p></div>)}
        <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label={`Reply to ${t.title}`} placeholder="Reply to this discussion…" maxLength={3000} value={reply[t.id] ?? ""} onChange={e => setReply(p => ({ ...p, [t.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") void respond(t.id); }} /><Button variant="outline" disabled={busy || !reply[t.id]?.trim()} onClick={() => void respond(t.id)}>Reply</Button></div>
      </div>
    </article>)}
  </div>;
}
