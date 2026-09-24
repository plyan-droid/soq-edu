import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, MessageSquare, Send, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function nameOf(user: { email?: string; user_metadata?: Record<string, unknown> } | null) {
  const n = user?.user_metadata?.["full_name"];
  return (typeof n === "string" && n) || user?.email?.split("@")[0] || "Student";
}
const ago = (d: string) => new Date(d).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" });

/* ---------- Course Q&A ---------- */
export function CourseQA({ slug }: { slug: string }) {
  const { user, isAdmin, isTrainer } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [reply, setReply] = useState<Record<string, string>>({});
  const { data } = useQuery({
    queryKey: ["qa", slug],
    queryFn: async () => {
      const { data: qs } = await supabase.from("course_questions").select("*").eq("course_slug", slug).order("created_at", { ascending: false });
      const ids = (qs ?? []).map(x => x.id);
      const { data: as } = ids.length ? await supabase.from("course_answers").select("*").in("question_id", ids).order("created_at") : { data: [] };
      return (qs ?? []).map(x => ({ ...x, answers: (as ?? []).filter(a => a.question_id === x.id) }));
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["qa", slug] });
  const ask = async () => {
    if (!user || q.trim().length < 3) return;
    const { error } = await supabase.from("course_questions").insert({ course_slug: slug, user_id: user.id, author_name: nameOf(user), body: q.trim() });
    if (error) { toast.error("Couldn't post your question"); return; }
    setQ(""); refresh();
  };
  const answer = async (id: string) => {
    const body = reply[id]?.trim(); if (!user || !body) return;
    const { error } = await supabase.from("course_answers").insert({ question_id: id, user_id: user.id, author_name: nameOf(user), body, is_staff: isAdmin || isTrainer });
    if (error) { toast.error("Couldn't post your answer"); return; }
    setReply(r => ({ ...r, [id]: "" })); refresh();
  };
  const del = async (table: "course_questions" | "course_answers", id: string) => { await supabase.from(table).delete().eq("id", id); refresh(); };

  return (
    <div>
      <h2 className="flex items-center gap-2 text-2xl font-semibold text-primary"><MessageSquare className="size-6 text-brand-gold" /> Questions & answers</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ask the trainer or other students about this course.</p>
      {user ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Textarea value={q} onChange={e => setQ(e.target.value)} maxLength={2000} placeholder="Type your question…" className="min-h-12" />
          <Button onClick={() => void ask()} className="rounded-full sm:self-end">Ask</Button>
        </div>
      ) : <p className="mt-4 text-sm"><Link to="/login" className="text-primary underline">Log in</Link> to ask a question.</p>}
      <ul className="mt-6 space-y-4">
        {(data ?? []).length === 0 && <li className="text-sm text-muted-foreground">No questions yet. Be the first to ask.</li>}
        {(data ?? []).map(x => (
          <li key={x.id} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-medium">{x.body}</p><p className="mt-1 text-xs text-muted-foreground">{x.author_name} · {ago(x.created_at)}</p></div>
              {(user?.id === x.user_id || isAdmin) && <button aria-label="Delete question" onClick={() => void del("course_questions", x.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>}
            </div>
            {x.answers.length > 0 && <ul className="mt-3 space-y-2 border-l-2 border-brand-gold/40 pl-4">
              {x.answers.map(a => (
                <li key={a.id} className="text-sm">
                  <p>{a.body}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">{a.author_name}{a.is_staff && <span className="rounded-full bg-brand-gold/20 px-2 text-[10px] font-semibold text-primary">SOQ TRAINER</span>} · {ago(a.created_at)}
                    {(user?.id === a.user_id || isAdmin) && <button onClick={() => void del("course_answers", a.id)} className="hover:text-destructive">Delete</button>}</p>
                </li>))}
            </ul>}
            {user && <div className="mt-3 flex gap-2"><Input value={reply[x.id] ?? ""} onChange={e => setReply(r => ({ ...r, [x.id]: e.target.value }))} placeholder="Write an answer…" maxLength={2000} /><Button variant="outline" onClick={() => void answer(x.id)}>Reply</Button></div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Lesson notes ---------- */
export function LessonNotes({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    setBody(""); setSaved(null);
    void supabase.from("lesson_notes").select("body,updated_at").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle()
      .then(({ data }) => { if (data) { setBody(data.body); setSaved(data.updated_at); } });
  }, [user, lessonId]);
  if (!user) return null;
  const save = async () => {
    const now = new Date().toISOString();
    const { error } = await supabase.from("lesson_notes").upsert({ user_id: user.id, lesson_id: lessonId, body, updated_at: now }, { onConflict: "user_id,lesson_id" });
    if (error) { toast.error("Couldn't save your note"); return; }
    setSaved(now); toast.success("Note saved");
  };
  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><StickyNote className="size-5" /> My notes</h3>
      <p className="text-xs text-muted-foreground">Only you can see these.</p>
      <Textarea value={body} onChange={e => setBody(e.target.value)} className="mt-3 min-h-32" placeholder="Write notes for this lesson…" maxLength={10000} />
      <div className="mt-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">{saved ? `Saved ${new Date(saved).toLocaleString("en-SG")}` : "Not saved yet"}</span><Button size="sm" className="rounded-full" onClick={() => void save()}>Save note</Button></div>
    </div>
  );
}

/* ---------- Course chatroom ---------- */
type Msg = { id: string; user_id: string; author_name: string; body: string; created_at: string };
export function CourseChatroom({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!user) return;
    void supabase.from("course_chat_messages").select("*").eq("course_slug", slug).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setMsgs(((data ?? []) as Msg[]).reverse()));
    const ch = supabase.channel(`chat-${slug}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "course_chat_messages", filter: `course_slug=eq.${slug}` }, p => setMsgs(m => m.some(x => x.id === (p.new as Msg).id) ? m : [...m, p.new as Msg]))
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, slug]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [msgs]);
  if (!user) return null;
  const send = async () => {
    const body = text.trim(); if (!body) return;
    const { data, error } = await supabase.from("course_chat_messages").insert({ course_slug: slug, user_id: user.id, author_name: nameOf(user), body }).select().single();
    if (error) { toast.error("Only students enrolled in this course can chat here"); return; }
    setText(""); setMsgs(m => m.some(x => x.id === data.id) ? m : [...m, data as Msg]);
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><MessageSquare className="size-5" /> Class chat</h3>
      <div className="mt-3 h-64 space-y-2 overflow-y-auto rounded-md bg-muted/50 p-3 text-sm">
        {msgs.length === 0 && <p className="text-muted-foreground">No messages yet. Say hello to your classmates.</p>}
        {msgs.map(m => (
          <div key={m.id} className={m.user_id === user.id ? "text-right" : ""}>
            <span className={`inline-block max-w-[85%] rounded-lg px-3 py-1.5 ${m.user_id === user.id ? "bg-primary text-primary-foreground" : "bg-background"}`}>{m.body}</span>
            <p className="text-[10px] text-muted-foreground">{m.author_name} · {new Date(m.created_at).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); void send(); }}>
        <Input value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="Message your class…" />
        <Button type="submit" size="icon" aria-label="Send"><Send /></Button>
      </form>
    </div>
  );
}

/* ---------- Gift a course ---------- */
export function GiftCourse({ slug, title }: { slug: string; title: string }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", message: "", date: new Date().toISOString().slice(0, 10) });
  const submit = async () => {
    if (!user) return;
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) { toast.error("Add the person's name and a valid email"); return; }
    const { error } = await supabase.from("gifts").insert({ buyer_id: user.id, course_slug: slug, recipient_name: f.name.trim(), recipient_email: f.email.trim(), message: f.message.trim(), send_on: f.date });
    if (error) { toast.error("Couldn't save the gift"); return; }
    toast.success(`Gift of ${title} saved for ${f.name}. SOQ will contact you to arrange payment.`);
    setOpen(false); setF({ ...f, name: "", email: "", message: "" });
  };
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-center gap-2 text-sm text-primary underline underline-offset-4"><Gift className="size-4" /> Gift this course</button>
      {open && (user ? (
        <div className="mt-3 space-y-2 rounded-md border border-border p-3">
          <Input placeholder="Their name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} maxLength={100} />
          <Input placeholder="Their email" type="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} maxLength={255} />
          <Textarea placeholder="A short message (optional)" value={f.message} onChange={e => setF({ ...f, message: e.target.value })} maxLength={500} />
          <label className="block text-xs text-muted-foreground">Send on<Input type="date" value={f.date} min={new Date().toISOString().slice(0, 10)} onChange={e => setF({ ...f, date: e.target.value })} /></label>
          <Button className="w-full" onClick={() => void submit()}>Save gift</Button>
        </div>
      ) : <p className="mt-2 text-center text-sm"><Link to="/login" className="underline">Log in</Link> to send a gift.</p>)}
    </div>
  );
}
