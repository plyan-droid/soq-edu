import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime, safeHref } from "@/lib/learning";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [
    { title: "Events & Open Houses | SOQ International Academy" },
    { name: "description", content: "Open houses, workshops and talks at SOQ International Academy. Sign up for a free seat." },
    { property: "og:title", content: "SOQ events and open houses" },
    { property: "og:description", content: "Workshops, talks and open houses at 10 Anson Road and online." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EventsPage,
});

function EventsPage() {
  const { user, isAdmin, isTrainer } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["events", user?.id], queryFn: async () => {
    const [e, c, mine] = await Promise.all([
      supabase.from("events").select("*").gte("starts_at", new Date(Date.now() - 3 * 3600e3).toISOString()).order("starts_at"),
      supabase.rpc("event_counts"),
      user ? supabase.from("event_signups").select("event_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { event_id: string }[] }),
    ]);
    return { events: e.data ?? [], counts: Object.fromEntries((c.data ?? []).map(x => [x.event_id, Number(x.n)])) as Record<string, number>, mine: new Set((mine.data ?? []).map(x => x.event_id)) };
  } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["events"] });
  const join = async (id: string) => {
    if (!user) return;
    const name = (user.user_metadata?.["full_name"] as string) || user.email || "Guest";
    const { error } = await supabase.from("event_signups").insert({ event_id: id, user_id: user.id, name });
    if (error) { toast.error("Couldn't sign you up"); return; }
    toast.success("You're signed up"); refresh();
  };
  const leave = async (id: string) => { await supabase.from("event_signups").delete().eq("event_id", id).eq("user_id", user!.id); refresh(); };
  return (
    <>
      <PageHero eyebrow="Events" title="Open houses, workshops and talks." intro="Meet our trainers, try a class and ask your questions in person or online." />
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        {(data?.events.length ?? 0) === 0 ? <p className="text-muted-foreground">No upcoming events yet. Follow us or join the newsletter to hear first.</p> : (
          <ul className="space-y-4">{data!.events.map(e => {
            const n = data!.counts[e.id] ?? 0; const full = n >= e.capacity; const joined = data!.mine.has(e.id);
            return <li key={e.id} className="rounded-lg border border-border bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="font-serif text-3xl text-primary">{e.title}</h2>
                  <p className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="size-4" />{fmtDateTime(e.starts_at)}</span><span className="flex items-center gap-1"><MapPin className="size-4" />{e.online_url ? "Online" : e.location}</span><span className="flex items-center gap-1"><Users className="size-4" />{n}/{e.capacity} seats taken</span></p></div>
                <div className="flex gap-2">
                  {!user ? <Button asChild className="rounded-full"><Link to="/login">Log in to sign up</Link></Button>
                    : joined ? <><Button variant="outline" onClick={() => void leave(e.id)}>Cancel my seat</Button>{e.online_url && <Button asChild><a href={safeHref(e.online_url)} target="_blank" rel="noreferrer">Join online</a></Button>}</>
                    : <Button className="rounded-full" disabled={full} onClick={() => void join(e.id)}>{full ? "Full" : "Sign up"}</Button>}
                  {(isAdmin || e.created_by === user?.id) && <Button variant="ghost" size="icon" aria-label="Delete event" onClick={async () => { if (confirm("Delete this event?")) { await supabase.from("events").delete().eq("id", e.id); refresh(); } }}><Trash2 /></Button>}
                </div>
              </div>
              {e.description && <p className="mt-4 whitespace-pre-line text-sm leading-6">{e.description}</p>}
            </li>;
          })}</ul>
        )}
        {user && (isAdmin || isTrainer) && <NewEvent userId={user.id} onDone={refresh} />}
      </section>
    </>
  );
}

function NewEvent({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [f, setF] = useState({ title: "", description: "", when: "", location: "10 Anson Road, International Plaza, Singapore", url: "", cap: 30 });
  const save = async () => {
    if (!f.title.trim() || !f.when) { toast.error("Add a title and date"); return; }
    const { error } = await supabase.from("events").insert({ title: f.title.trim(), description: f.description, starts_at: new Date(f.when).toISOString(), location: f.location, online_url: f.url || null, capacity: f.cap, created_by: userId });
    if (error) { toast.error("Couldn't save"); return; }
    toast.success("Event added"); setF({ ...f, title: "", description: "", when: "" }); onDone();
  };
  return (
    <div className="mt-14 space-y-3 rounded-lg border border-brand-gold/40 bg-secondary p-6">
      <h2 className="font-serif text-2xl text-primary">Add an event</h2>
      <Input placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} maxLength={150} />
      <Textarea placeholder="Description" value={f.description} onChange={e => setF({ ...f, description: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-3"><Input type="datetime-local" value={f.when} onChange={e => setF({ ...f, when: e.target.value })} /><Input placeholder="Location" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /><Input type="number" placeholder="Seats" value={f.cap} onChange={e => setF({ ...f, cap: +e.target.value || 30 })} /></div>
      <Input placeholder="Online link (optional)" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
      <Button className="rounded-full" onClick={() => void save()}>Add event</Button>
    </div>
  );
}
