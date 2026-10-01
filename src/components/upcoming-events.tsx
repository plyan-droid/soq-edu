import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Mic, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { categoryLabel, eventImage, timeRange, type EventItem } from "@/lib/events";

/** Next public events only — private events are never shown here. */
function usePublicEvents(limit: number) {
  return useQuery({
    queryKey: ["events", "public-upcoming", limit],
    queryFn: async () => {
      const [e, c] = await Promise.all([
        supabase.from("events").select("*").eq("is_private", false).gte("starts_at", new Date().toISOString()).order("starts_at").limit(limit),
        supabase.rpc("event_counts"),
      ]);
      return { events: (e.data ?? []) as EventItem[], counts: Object.fromEntries((c.data ?? []).map(x => [x.event_id, Number(x.n)])) as Record<string, number> };
    },
  });
}

export function HomeEvents() {
  const { data } = usePublicEvents(3);
  if (!data?.events.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 pb-16 lg:px-8">
      <div className="flex items-end justify-between gap-5">
        <div><p className="text-[11px] uppercase tracking-[0.35em] text-foreground/70">Join us in person or online</p><h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Upcoming Events</h2></div>
        <Link to="/events" className="hidden items-center gap-2 text-sm text-primary md:flex">All events <ArrowRight className="size-4" /></Link>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {data.events.map(e => {
          const d = new Date(e.starts_at); const left = Math.max(0, e.capacity - (data.counts[e.id] ?? 0));
          return (
            <Link key={e.id} to="/events" className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="relative h-40 overflow-hidden">
                <img src={eventImage(e.image_key)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute left-3 top-3 rounded-lg bg-background px-3 py-1.5 text-center shadow"><p className="font-serif text-2xl leading-none text-primary">{d.getDate()}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.toLocaleDateString("en-GB", { month: "short" })}</p></div>
              </div>
              <div className="p-5">
                <p className="text-xs text-brand-gold">{categoryLabel(e.category)}{e.online_url ? " · Online" : ""}</p>
                <h3 className="mt-1 font-serif text-2xl leading-tight text-primary">{e.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{timeRange(e.starts_at, e.ends_at)}</p>
                {e.speaker && <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80"><Mic className="size-3" />{e.speaker}{e.speaker_role ? `, ${e.speaker_role}` : ""}</p>}
                <p className="mt-1 flex items-center gap-1.5 text-xs text-foreground/80"><MapPin className="size-3" />{e.online_url ? "Online" : e.location}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"><Users className="size-3" />{left === 0 ? "Fully booked" : `${left} free seats left`} · Reserve <ArrowRight className="size-3" /></p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function CommunityEvents() {
  const { data } = usePublicEvents(3);
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="eyebrow mb-3">Upcoming events</p>
      {!data?.events.length ? <p className="text-sm text-muted-foreground">New events coming soon.</p> : (
        <ul className="grid gap-3">{data.events.map(e => (
          <li key={e.id} className="text-sm">
            <p className="font-semibold text-primary">{timeRange(e.starts_at, null)}</p>
            <Link to="/events" className="text-foreground/80 hover:text-brand-gold">{e.title}</Link>
            {e.speaker && <p className="text-xs text-muted-foreground">with {e.speaker}</p>}
          </li>))}</ul>
      )}
      <Link to="/events" className="mt-3 inline-block text-sm font-medium text-primary underline">See all events</Link>
    </div>
  );
}
