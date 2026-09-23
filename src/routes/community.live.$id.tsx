import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/learning";
import { type Livestream, youtubeId } from "@/lib/livestreams";

export const Route = createFileRoute("/community/live/$id")({
  head: () => ({
    meta: [
      { title: "Livestream — SOQ Community" },
      { name: "description", content: "Watch this SOQ Community livestream and join the live chat." },
      { property: "og:title", content: "Livestream — SOQ Community" },
      { property: "og:description", content: "Watch this SOQ Community livestream and join the live chat." },
      { property: "og:type", content: "video.other" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StreamPage,
});

function StreamPage() {
  const { id } = Route.useParams();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const [host, setHost] = useState("");
  useEffect(() => setHost(window.location.hostname), []);
  const { data: s, isLoading } = useQuery({ queryKey: ["livestream", id], queryFn: async () => (await supabase.from("community_livestreams").select("*").eq("id", id).maybeSingle()).data as Livestream | null });
  if (isLoading) return <div className="mx-auto max-w-6xl px-5 py-10 text-muted-foreground">Loading…</div>;
  if (!s) return <div className="mx-auto max-w-6xl px-5 py-10"><p>This livestream doesn't exist.</p><Link to="/community/live" className="underline">All livestreams</Link></div>;
  const vid = youtubeId(s.video_url);
  const setStatus = async (status: string) => { await supabase.from("community_livestreams").update({ status }).eq("id", s.id); void qc.invalidateQueries({ queryKey: ["livestream", id] }); void qc.invalidateQueries({ queryKey: ["livestreams"] }); };
  const remove = async () => { if (!confirm("Delete this livestream?")) return; await supabase.from("community_livestreams").delete().eq("id", s.id); void qc.invalidateQueries({ queryKey: ["livestreams"] }); void nav({ to: "/community/live" }); };
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link to="/community/live" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="size-4" />All livestreams</Link>
      <div className="mt-4 rounded-xl border border-border bg-card p-5 md:p-7">
        <h1 className="font-serif text-3xl text-brand-navy md:text-4xl">{s.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {s.status === "live" && <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground"><Radio className="size-3" />LIVE</span>}
          {s.status === "upcoming" && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">Upcoming</span>}
          {s.status === "ended" && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">Replay</span>}
          {fmtDateTime(s.starts_at)}{s.hosts && <> · with {s.hosts}</>}
        </p>
        <div className="mt-5 grid gap-4 rounded-lg bg-muted p-3 lg:grid-cols-[1fr_320px]">
          <div className="aspect-video overflow-hidden rounded-md bg-brand-navy">
            {vid && <iframe className="size-full" src={`https://www.youtube-nocookie.com/embed/${vid}`} title={s.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture" allowFullScreen />}
          </div>
          <div className="min-h-[320px] overflow-hidden rounded-md bg-card">
            {vid && host && s.status !== "ended"
              ? <iframe className="size-full min-h-[320px]" src={`https://www.youtube.com/live_chat?v=${vid}&embed_domain=${host}`} title="Live chat" />
              : <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">{s.status === "ended" ? "Live chat has closed. Discuss this replay in the Community." : "Live chat opens when the stream starts."}</div>}
          </div>
        </div>
        {s.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/85">{s.description}</p>}
        {isAdmin && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-4">
            <span className="self-center text-sm text-muted-foreground">Staff:</span>
            {(["upcoming", "live", "ended"] as const).map(st => <Button key={st} size="sm" variant={s.status === st ? "default" : "outline"} className="rounded-full" onClick={() => void setStatus(st)}>{st === "ended" ? "Mark as replay" : st === "live" ? "Go live" : "Upcoming"}</Button>)}
            <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => void remove()}>Delete</Button>
          </div>
        )}
      </div>
    </div>
  );
}
