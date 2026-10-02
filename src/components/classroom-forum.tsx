import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, PenLine, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/community-ui";
import { timeAgo } from "@/lib/community";
import { NoticeFileList, asFiles } from "@/components/notice-files";
import { NoticeBody } from "@/components/notice-body";
import type { User } from "@supabase/supabase-js";

type Thread = { id: string; author_id: string; author_name: string; title: string; body: string; created_at: string };
type Reply = { id: string; thread_id: string; author_id: string; author_name: string; body: string; created_at: string };
type Announcement = { id: string; title: string; body: string; created_at: string; attachments: unknown };
const displayName = (user: User) => (typeof user.user_metadata?.["full_name"] === "string" && user.user_metadata["full_name"]) || user.email?.split("@")[0] || "Member";
const when = (date: string) => new Date(date).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function ClassroomForum({ slug, user, isStaff, courseTitle }: { slug: string; user: User; isStaff: boolean; courseTitle?: string }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sort, setSort] = useState<"latest" | "top">("latest");
  const [expanded, setExpanded] = useState<string | null>(null);
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
  const { data: announcements = [] } = useQuery({
    queryKey: ["notices", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_notices").select("id,title,body,created_at,attachments,pinned").eq("course_slug", slug).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).filter(n => !n.pinned) as Announcement[];
    },
  });
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["classroom-threads", slug] }); void qc.invalidateQueries({ queryKey: ["classroom-replies", slug] }); };
  const create = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.from("classroom_threads").insert({ course_slug: slug, author_id: user.id, author_name: displayName(user), title: title.trim() || body.trim().split("\n")[0]?.slice(0, 120) || "Class post", body: body.trim() });
    setBusy(false);
    if (error) return void toast.error("Couldn't post this discussion");
    setTitle(""); setBody(""); setComposing(false); refresh();
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
  const ordered = [...threads].sort((a, b) => sort === "top"
    ? replies.filter(r => r.thread_id === b.id).length - replies.filter(r => r.thread_id === a.id).length || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const feed = [...ordered.map(thread => ({ kind: "thread" as const, date: thread.created_at, thread })),
    ...(courseTitle ? announcements.map(announcement => ({ kind: "announcement" as const, date: announcement.created_at, announcement })) : [])]
    .sort((a, b) => sort === "top" ? (a.kind === b.kind ? (a.kind === "thread" && b.kind === "thread" ? replies.filter(r => r.thread_id === b.thread.id).length - replies.filter(r => r.thread_id === a.thread.id).length || new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime()) : a.kind === "announcement" ? -1 : 1) : new Date(b.date).getTime() - new Date(a.date).getTime());
  return <div className="space-y-5">
    {courseTitle && <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Button variant={sort === "latest" ? "default" : "ghost"} size="sm" className="rounded-full px-4" onClick={() => setSort("latest")}>Latest</Button><Button variant={sort === "top" ? "default" : "ghost"} size="sm" className="rounded-full px-4" onClick={() => setSort("top")}>Top</Button></div><Button onClick={() => setComposing(true)}><PenLine className="size-4" /> Write a post</Button></div>}
    <div className="space-y-3">
      {!composing ? !courseTitle && <Button variant="outline" className="h-12 w-full justify-start text-muted-foreground" onClick={() => setComposing(true)}>Post something to your class…</Button> : <div className="space-y-3 rounded-md border border-border bg-card p-4">
        <h2 className="font-serif text-xl text-primary">Post to your class</h2>
        <Input aria-label="Post title" placeholder="Title (optional)" maxLength={160} value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea aria-label="Post message" placeholder="Share a question, idea or resource with your class…" maxLength={5000} value={body} onChange={e => setBody(e.target.value)} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setComposing(false)}>Cancel</Button><Button onClick={() => void create()} disabled={busy || !body.trim()}>Post</Button></div>
      </div>}
    </div>
    {isLoading ? <p className="text-muted-foreground">Loading discussions…</p> : error ? <p className="text-destructive">Couldn't load discussions. Please try again.</p> : feed.length === 0 ? <p className="border-t border-border py-6 text-muted-foreground">No posts yet. Start a conversation with your class.</p> : feed.map(item => item.kind === "announcement" ? <article key={`notice-${item.announcement.id}`} className="rounded-md border border-border bg-card p-6 transition-colors hover:border-brand-gold"><div className="flex items-center gap-3"><Avatar name="SOQ Trainer" size={36} /><div><p className="text-sm font-medium">Trainer <span className="ml-1 rounded-full bg-brand-gold-soft px-2 py-0.5 text-xs text-primary">Announcement</span></p><p className="text-xs text-muted-foreground">{timeAgo(item.date)}</p></div></div><h3 className="mt-4 font-serif text-3xl leading-tight text-primary">{item.announcement.title}</h3>{item.announcement.body && <NoticeBody text={item.announcement.body} className="mt-3 text-sm leading-6" />}<NoticeFileList files={asFiles(item.announcement.attachments)} /></article> : (() => { const t = item.thread; return <article key={t.id} className="rounded-md border border-border bg-card p-6 transition-colors hover:border-brand-gold">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><Avatar name={t.author_name} size={36} /><div><p className="text-sm font-medium text-foreground">{t.author_name}</p><p className="text-xs text-muted-foreground">{timeAgo(t.created_at)}</p></div></div>
        {(t.author_id === user.id || isStaff) && <Button variant="ghost" size="icon-sm" title="Delete discussion" aria-label="Delete discussion" onClick={() => void remove("classroom_threads", t.id)}><Trash2 /></Button>}
      </div>
      <h3 className="mt-4 font-serif text-3xl leading-tight text-primary">{t.title}</h3>
      {t.body.trim() !== t.title.trim() && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">{t.body}</p>}
      <Button variant="ghost" size="sm" className="mt-4 gap-2 px-0 text-muted-foreground" aria-expanded={expanded === t.id} onClick={() => setExpanded(expanded === t.id ? null : t.id)}><MessageCircle className="size-4" />{replies.filter(r => r.thread_id === t.id).length} replies <ChevronDown className={`size-3.5 transition-transform ${expanded === t.id ? "rotate-180" : ""}`} /></Button>
      {expanded === t.id && <div className="mt-3 border-t border-border pt-4">
        {replies.filter(r => r.thread_id === t.id).map(r => <div key={r.id} className="mb-3 text-sm"><div className="flex items-start justify-between gap-2"><p className="whitespace-pre-line">{r.body}</p>{(r.author_id === user.id || isStaff) && <Button variant="ghost" size="icon-sm" title="Delete reply" aria-label="Delete reply" onClick={() => void remove("classroom_replies", r.id)}><Trash2 /></Button>}</div><p className="mt-1 text-xs text-muted-foreground">{r.author_name} · {when(r.created_at)}</p></div>)}
        <div className="flex flex-col gap-2 sm:flex-row"><Input aria-label={`Reply to ${t.title}`} placeholder="Reply to this discussion…" maxLength={3000} value={reply[t.id] ?? ""} onChange={e => setReply(p => ({ ...p, [t.id]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") void respond(t.id); }} /><Button variant="outline" disabled={busy || !reply[t.id]?.trim()} onClick={() => void respond(t.id)}>Reply</Button></div>
      </div>}
    </article>; })())}
  </div>;
}
