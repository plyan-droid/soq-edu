import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

type Ticket = { id: string; full_name: string; email: string; phone: string | null; topic: string; message: string; status: string; created_at: string };
type DemoChat = { id: string; name: string; phone: string; topic: string; status: string; messages: { from: "visitor" | "staff"; text: string; time: string }[] };

// Illustrative page content only: never inserted into the database or sent to WhatsApp.
const demoChats: DemoChat[] = [
  { id: "demo-1", name: "Amelia Tan", phone: "+65 9000 0123", topic: "Course dates", status: "New", messages: [
    { from: "visitor", text: "Hello! When is the next intake for the AI course?", time: "10:42" },
    { from: "staff", text: "Thanks for your interest. Which AI course are you considering? We can help check the next available dates.", time: "10:46" },
    { from: "visitor", text: "The introductory course, please. Is there a weekend option?", time: "10:48" },
  ] },
  { id: "demo-2", name: "Daniel Lim", phone: "+65 9000 0456", topic: "Funding enquiry", status: "In progress", messages: [
    { from: "visitor", text: "Can I use SkillsFuture Credit towards a course?", time: "Yesterday 15:12" },
    { from: "staff", text: "We can help you check the course and your eligibility. Which programme interests you?", time: "Yesterday 15:20" },
  ] },
  { id: "demo-3", name: "Priya Nair", phone: "+65 9000 0789", topic: "Group training", status: "New", messages: [
    { from: "visitor", text: "Our team is interested in training for six colleagues. Could someone share the options?", time: "Monday 09:18" },
  ] },
];

const statusLabels: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
const dateLabel = (value: string) => new Date(value).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" });

export function StaffMessages() {
  const qc = useQueryClient();
  const [source, setSource] = useState<"all" | "contact" | "whatsapp">("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { data: tickets = [], isPending, error: loadError } = useQuery({
    queryKey: ["admin-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("id,full_name,email,phone,topic,message,status,created_at").order("created_at", { ascending: false }).limit(300);
      if (error) throw error;
      return data as Ticket[];
    },
  });
  const entries = useMemo(() => [
    ...tickets.map(t => ({ key: `contact-${t.id}`, source: "contact" as const, name: t.full_name, summary: t.message, topic: t.topic.replaceAll("_", " "), status: statusLabels[t.status] ?? t.status, order: new Date(t.created_at).getTime(), ticket: t, chat: null })),
    ...demoChats.map((c, i) => ({ key: c.id, source: "whatsapp" as const, name: c.name, summary: c.messages.at(-1)?.text ?? "", topic: c.topic, status: c.status, order: Date.now() - i * 60_000, ticket: null, chat: c })),
  ], [tickets]);
  const visible = entries.filter(e => (source === "all" || e.source === source) && `${e.name} ${e.topic} ${e.summary}`.toLowerCase().includes(query.trim().toLowerCase()));
  const active = visible.find(e => e.key === selected) ?? visible[0];
  const updateStatus = async (id: string, status: string) => {
    setError("");
    const { error: updateError } = await supabase.from("support_tickets").update({ status }).eq("id", id);
    if (updateError) setError("Couldn't update this enquiry. Please try again.");
    else void qc.invalidateQueries({ queryKey: ["admin-tickets"] });
  };

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5">
        <div><h2 className="font-serif text-3xl text-primary">Inbox</h2><p className="mt-1 text-sm text-muted-foreground">Contact form enquiries are live. WhatsApp conversations below are samples only.</p></div>
        <span className="border border-border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">WhatsApp · Not connected</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {([ ["all", "All"], ["contact", "Contact form"], ["whatsapp", "WhatsApp · DEMO"] ] as const).map(([value, label]) => (
          <Button key={value} size="sm" variant={source === value ? "default" : "outline"} onClick={() => { setSource(value); setSelected(null); }}>{label} ({value === "all" ? entries.length : entries.filter(e => e.source === value).length})</Button>
        ))}
        <div className="relative w-full sm:ml-auto sm:w-56"><Search aria-hidden className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search messages" placeholder="Search messages" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" /></div>
      </div>
      {loadError && <p role="alert" className="text-sm text-destructive">Contact enquiries couldn't load. Sample chats are still shown.</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {isPending && <p className="text-sm text-muted-foreground">Loading enquiries…</p>}
      <div className="grid min-h-[28rem] overflow-hidden border border-border bg-card lg:grid-cols-[minmax(15rem,0.85fr)_minmax(0,1.4fr)]">
        <div className="max-h-[34rem] overflow-y-auto border-b border-border lg:border-b-0 lg:border-r">
          {visible.length === 0 && <p className="p-6 text-sm text-muted-foreground">No messages match your search.</p>}
          {visible.map(e => <Button key={e.key} variant="ghost" className={`h-auto w-full flex-col items-stretch gap-2 rounded-none border-b border-border px-5 py-4 text-left font-normal hover:bg-muted ${active?.key === e.key ? "bg-muted" : ""}`} onClick={() => setSelected(e.key)}>
            <span className="flex items-center justify-between gap-2"><span className="min-w-0 truncate font-semibold text-foreground">{e.name}</span><span className="shrink-0 text-xs text-muted-foreground">{e.source === "whatsapp" ? "DEMO" : dateLabel(e.ticket?.created_at ?? "")}</span></span>
            <span className="flex items-center gap-2 text-xs text-muted-foreground">{e.source === "whatsapp" ? <MessageCircle className="size-3.5" /> : <Mail className="size-3.5" />}{e.source === "whatsapp" ? "WhatsApp · DEMO" : "Contact form"} · {e.status}</span>
            <span className="block truncate text-sm text-muted-foreground">{e.summary}</span>
          </Button>)}
        </div>
        <div className="min-w-0 p-5 sm:p-7">
          {!active ? <p className="text-sm text-muted-foreground">Select a message to read it.</p> : <>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-5"><div><p className="text-xs font-semibold uppercase text-muted-foreground">{active.source === "whatsapp" ? "WhatsApp · DEMO" : "Contact form"}</p><h3 className="mt-1 font-serif text-2xl text-primary">{active.name}</h3><p className="mt-1 text-sm text-muted-foreground">{active.topic} · {active.chat?.phone ?? active.ticket?.phone ?? active.ticket?.email}</p></div><span className="text-xs text-muted-foreground">{active.status}</span></div>
            {active.ticket ? <div className="space-y-5 py-6"><p className="whitespace-pre-wrap break-words text-sm leading-7">{active.ticket.message}</p><p className="text-xs text-muted-foreground">Received {dateLabel(active.ticket.created_at)}</p><div className="flex flex-wrap items-center gap-3 border-t border-border pt-5"><Button asChild size="sm"><a href={`mailto:${active.ticket.email}?subject=${encodeURIComponent("Re: your SOQ enquiry")}`}><Mail className="size-4" /> Reply by email</a></Button><label className="text-xs text-muted-foreground">Status <select className="ml-2 h-9 rounded border border-input bg-background px-2 text-sm text-foreground" value={active.ticket.status} onChange={e => void updateStatus(active.ticket?.id ?? "", e.target.value)}>{["open", "in_progress", "resolved"].map(s => <option key={s} value={s}>{statusLabels[s]}</option>)}</select></label></div></div> : <div className="space-y-5 py-6"><p className="border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">DEMO conversation · These messages were not received or sent through WhatsApp.</p><div className="space-y-4">{active.chat?.messages.map((m, i) => <div key={i} className={`flex ${m.from === "staff" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] border px-4 py-3 text-sm ${m.from === "staff" ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted"}`}><p className="whitespace-pre-wrap break-words">{m.text}</p><p className="mt-2 text-xs opacity-70">{m.from === "staff" ? "SOQ · " : ""}{m.time} · DEMO</p></div></div>)}</div><div className="border-t border-border pt-5"><p className="text-sm font-medium">Replies unavailable</p><p className="mt-1 text-sm text-muted-foreground">Connect WhatsApp Business and set up incoming messages before real chats or replies can appear here.</p></div></div>}
          </>}
        </div>
      </div>
    </div>
  );
}