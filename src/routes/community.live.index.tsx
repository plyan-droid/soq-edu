import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CommunitySidebar, CommunityMobileNav } from "@/components/community-sidebar";
import { fmtDateTime } from "@/lib/learning";
import { type Livestream, youtubeId, thumb } from "@/lib/livestreams";

export const Route = createFileRoute("/community/live/")({
  head: () => ({
    meta: [
      { title: "Livestreams — SOQ Community" },
      { name: "description", content: "Watch live sessions and replays from SOQ trainers, alumni and industry guests." },
      { property: "og:title", content: "Livestreams — SOQ Community" },
      { property: "og:description", content: "Live sessions and replays from SOQ trainers, alumni and industry guests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const { isAdmin } = useAuth();
  const { data = [] } = useQuery({ queryKey: ["livestreams"], queryFn: async () => ((await supabase.from("community_livestreams").select("*").order("starts_at", { ascending: false })).data ?? []) as Livestream[] });
  const live = data.filter(s => s.status === "live");
  const upcoming = data.filter(s => s.status === "upcoming").reverse();
  const ended = data.filter(s => s.status === "ended");
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
      <div className="hidden lg:block"><CommunitySidebar active="live" /></div>
      <main>
        <CommunityMobileNav active="live" />
        <h1 className="font-serif text-4xl text-brand-navy">Livestreams</h1>
        <p className="mt-2 text-muted-foreground">Live classes, demos and talks from SOQ trainers and guests. Replays stay here after each stream.</p>
        {isAdmin && <AddStream />}
        {data.length === 0 && <p className="mt-8 rounded-lg border border-border bg-card p-6 text-muted-foreground">No livestreams yet. Check back soon.</p>}
        <Group title="Happening now" items={live} />
        <Group title="Upcoming" items={upcoming} />
        <Group title="Replays" items={ended} />
      </main>
    </div>
  );
}

function Group({ title, items }: { title: string; items: Livestream[] }) {
  if (!items.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl text-brand-navy">{title}</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(s => (
          <Link key={s.id} to="/community/live/$id" params={{ id: s.id }} className="group overflow-hidden rounded-xl border border-border bg-card transition hover:shadow-md">
            <div className="relative aspect-video bg-brand-navy">
              {thumb(s.video_url) && <img src={thumb(s.video_url)!} alt="" loading="lazy" className="size-full object-cover" />}
              {s.status === "live" && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground"><Radio className="size-3" />LIVE</span>}
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{fmtDateTime(s.starts_at)}</p>
              <h3 className="mt-1 font-semibold text-brand-navy group-hover:underline">{s.title}</h3>
              {s.hosts && <p className="mt-1 text-sm text-muted-foreground">with {s.hosts}</p>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function AddStream() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inp = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm";
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget); const g = (k: string) => String(f.get(k) ?? "").trim();
    if (!youtubeId(g("video_url"))) { setErr("Paste a YouTube video or live link."); return; }
    const { error } = await supabase.from("community_livestreams").insert({ title: g("title"), description: g("description"), hosts: g("hosts") || null, video_url: g("video_url"), starts_at: new Date(g("starts_at")).toISOString(), status: g("status") });
    if (error) { setErr(error.message); return; }
    setErr(null); setOpen(false); void qc.invalidateQueries({ queryKey: ["livestreams"] });
  };
  return (
    <div className="mt-5">
      <Button size="sm" className="rounded-full" onClick={() => setOpen(o => !o)}>{open ? "Cancel" : "+ Schedule a livestream"}</Button>
      {open && (
        <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-border bg-card p-5 sm:grid-cols-2">
          <input name="title" required minLength={3} placeholder="Title" className={`${inp} sm:col-span-2`} />
          <input name="hosts" placeholder="Hosts, e.g. Jane Tan (SOQ Trainer)" className={inp} />
          <input name="video_url" required placeholder="YouTube link" className={inp} />
          <input name="starts_at" type="datetime-local" required className={inp} />
          <select name="status" className={inp} defaultValue="upcoming"><option value="upcoming">Upcoming</option><option value="live">Live now</option><option value="ended">Replay</option></select>
          <textarea name="description" rows={3} placeholder="What's this stream about?" className={`${inp} sm:col-span-2`} />
          {err && <p className="text-sm text-destructive sm:col-span-2">{err}</p>}
          <Button type="submit" className="rounded-full sm:col-span-2">Save</Button>
        </form>
      )}
    </div>
  );
}
