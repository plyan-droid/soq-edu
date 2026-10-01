import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, Clock, MapPin, Mic, Users, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { safeHref } from "@/lib/learning";
import { EVENT_CATEGORIES, categoryLabel, downloadIcs, eventImage, timeRange, type EventItem } from "@/lib/events";

export const Route = createFileRoute("/events")({
  head: () => ({ meta: [
    { title: "Events & Open Houses | SOQ International Academy" },
    { name: "description", content: "Open houses, workshops, talks and showcases at SOQ International Academy. Reserve a free seat." },
    { property: "og:title", content: "SOQ events and open houses" },
    { property: "og:description", content: "Workshops, talks and open houses at 10 Anson Road and online." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: EventsPage,
});

function EventsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cat, setCat] = useState("all");
  const [mode, setMode] = useState<"all" | "in" | "online">("all");
  const { data, isLoading } = useQuery({ queryKey: ["events", user?.id], queryFn: async () => {
    const [e, c, mine] = await Promise.all([
      supabase.from("events").select("*").order("starts_at"),
      supabase.rpc("event_counts"),
      user ? supabase.from("event_signups").select("event_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { event_id: string }[] }),
    ]);
    return { events: (e.data ?? []) as EventItem[], counts: Object.fromEntries((c.data ?? []).map(x => [x.event_id, Number(x.n)])) as Record<string, number>, mine: new Set((mine.data ?? []).map(x => x.event_id)) };
  } });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["events"] });
  const now = Date.now() - 3 * 3600e3;
  const { upcoming, past } = useMemo(() => {
    const all = data?.events ?? [];
    const match = (e: EventItem) => (cat === "all" || e.category === cat) && (mode === "all" || (mode === "online") === !!e.online_url);
    return {
      upcoming: all.filter(e => new Date(e.starts_at).getTime() >= now && match(e)),
      past: all.filter(e => new Date(e.starts_at).getTime() < now).reverse().slice(0, 6),
    };
  }, [data, cat, mode, now]);
  const join = async (id: string) => {
    if (!user) return;
    const name = (user.user_metadata?.["full_name"] as string) || user.email || "Guest";
    const { error } = await supabase.from("event_signups").insert({ event_id: id, user_id: user.id, name });
    if (error) { toast.error("Couldn't reserve your seat"); return; }
    toast.success("Your seat is reserved"); refresh();
  };
  const leave = async (id: string) => { await supabase.from("event_signups").delete().eq("event_id", id).eq("user_id", user!.id); toast.success("Seat cancelled"); refresh(); };
  const [featured, ...rest] = upcoming;

  const action = (e: EventItem) => {
    const n = data?.counts[e.id] ?? 0; const full = n >= e.capacity; const joined = data?.mine.has(e.id);
    return (
      <div className="flex flex-wrap gap-2">
        {!user ? <Button asChild className="rounded-full"><Link to="/login">Log in to reserve</Link></Button>
          : joined ? <>
            <Button variant="outline" className="rounded-full" onClick={() => void leave(e.id)}>Cancel my seat</Button>
            {e.online_url && <Button asChild className="rounded-full"><a href={safeHref(e.online_url)} target="_blank" rel="noreferrer">Join online</a></Button>}
          </> : <Button className="rounded-full" disabled={full} onClick={() => void join(e.id)}>{full ? "Fully booked" : "Reserve a free seat"}</Button>}
        <Button variant="ghost" className="rounded-full" onClick={() => downloadIcs(e)}><CalendarPlus className="size-4" />Add to calendar</Button>
      </div>
    );
  };
  const seats = (e: EventItem) => {
    const n = data?.counts[e.id] ?? 0; const left = Math.max(0, e.capacity - n);
    return (
      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, (n / e.capacity) * 100)}%` }} /></div>
        <p className="mt-1 text-xs text-muted-foreground"><Users className="mr-1 inline size-3" />{left === 0 ? "No seats left" : `${left} of ${e.capacity} seats left`}</p>
      </div>
    );
  };
  const meta = (e: EventItem) => (
    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
      <p className="flex items-center gap-2"><Clock className="size-4" />{timeRange(e.starts_at, e.ends_at)}</p>
      <p className="flex items-center gap-2">{e.online_url ? <Video className="size-4" /> : <MapPin className="size-4" />}{e.online_url ? "Online" : e.location}</p>
      {e.speaker && <p className="flex items-center gap-2"><Mic className="size-4" />{e.speaker}{e.speaker_role ? ` · ${e.speaker_role}` : ""}</p>}
    </div>
  );

  return (
    <>
      <PageHero eyebrow="Events" title="Open houses, workshops and talks." intro="Meet our trainers, try a class and ask your questions — in person at 10 Anson Road or online." />
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          {[["all", "All events"], ...EVENT_CATEGORIES].map(([k, l]) => (
            <button key={k} onClick={() => setCat(k)} className={`rounded-full border px-4 py-1.5 text-sm transition ${cat === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>{l}</button>
          ))}
          <span className="mx-2 h-5 w-px bg-border" />
          {([["all", "Anywhere"], ["in", "In person"], ["online", "Online"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-full px-3 py-1.5 text-sm ${mode === k ? "bg-secondary font-medium text-primary" : "text-muted-foreground hover:text-primary"}`}>{l}</button>
          ))}
        </div>

        {isLoading ? <div className="mt-8 h-72 animate-pulse rounded-xl bg-muted" />
          : !featured ? <p className="mt-10 text-muted-foreground">No upcoming events match. Join the newsletter to hear about the next one first.</p> : <>
          <article className="mt-8 grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-2">
            <img src={eventImage(featured.image_key)} alt="" className="h-64 w-full object-cover md:h-full" />
            <div className="p-7">
              <p className="text-xs font-medium uppercase tracking-widest text-brand-gold">Next up · {categoryLabel(featured.category)}</p>
              <h2 className="mt-2 font-serif text-4xl text-primary">{featured.title}</h2>
              {meta(featured)}
              <p className="mt-4 whitespace-pre-line text-sm leading-6">{featured.description}</p>
              {featured.agenda && <div className="mt-4 rounded-lg bg-secondary p-4"><p className="text-xs font-medium uppercase tracking-wider text-primary">Agenda</p><ul className="mt-2 space-y-1 text-sm">{featured.agenda.split("\n").filter(Boolean).map(l => <li key={l}>{l}</li>)}</ul></div>}
              {seats(featured)}
              <div className="mt-5">{action(featured)}</div>
            </div>
          </article>
          {rest.length > 0 && <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map(e => (
            <article key={e.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative"><img src={eventImage(e.image_key)} alt="" className="h-44 w-full object-cover" loading="lazy" />
                <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium text-primary">{categoryLabel(e.category)}</span></div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-serif text-2xl text-primary">{e.title}</h3>
                {meta(e)}
                <p className="mt-3 line-clamp-3 text-sm">{e.description}</p>
                <div className="mt-auto pt-3">{seats(e)}<div className="mt-4">{action(e)}</div></div>
              </div>
            </article>))}</div>}
        </>}

        {past.length > 0 && <div className="mt-16">
          <h2 className="font-serif text-3xl text-primary">Past events</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{past.map(e => (
            <div key={e.id} className="flex gap-4 rounded-lg border border-border bg-card p-3 opacity-80">
              <img src={eventImage(e.image_key)} alt="" className="size-16 rounded object-cover grayscale" loading="lazy" />
              <div><p className="font-medium text-primary">{e.title}</p><p className="text-xs text-muted-foreground">{timeRange(e.starts_at, null)}</p></div>
            </div>))}</div>
        </div>}
      </section>
    </>
  );
}
