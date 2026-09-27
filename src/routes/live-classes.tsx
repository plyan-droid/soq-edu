import { ListSkeleton } from "@/components/start-here";
import { SessionBookButton, SessionRequests } from "@/components/session-bookings";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Video, ExternalLink, CalendarClock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { fmtDateTime, safeHref, type LiveSession } from "@/lib/learning";
import { PageHero } from "@/components/page-hero";

export const Route = createFileRoute("/live-classes")({
  head: () => ({
    meta: [
      { title: "Live Classes | SOQ International Academy" },
      { name: "description", content: "Join live SOQ classes on Zoom or Whereby. Trainers schedule and host sessions; enrolled students join in one click." },
      { property: "og:title", content: "SOQ Live Classes" },
      { property: "og:description", content: "Schedule, host and join live SOQ classes on Zoom or Whereby." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiveClassesPage,
});

const courseName = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const platformOf = (url: string | null) => !url ? null : /whereby\.com/i.test(url) ? "Whereby" : /zoom\.us/i.test(url) ? "Zoom" : /meet\.google/i.test(url) ? "Google Meet" : /teams\.microsoft|teams\.live/i.test(url) ? "Teams" : "Online";
const okLink = (url: string) => /^(https?:\/\/)?([\w-]+\.)*(zoom\.us|whereby\.com|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com)\//i.test(url);
const sel = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  return now;
}
function phase(s: LiveSession, now: number) {
  const start = new Date(s.starts_at).getTime(); const end = start + s.duration_min * 60000;
  if (s.status === "cancelled") return "cancelled";
  if (now > end) return "ended";
  if (now >= start - 15 * 60000) return "open";
  return "soon";
}
function startsIn(s: LiveSession, now: number) {
  const m = Math.round((new Date(s.starts_at).getTime() - now) / 60000);
  if (m <= 0) return "Happening now";
  if (m < 60) return `Starts in ${m} min`;
  if (m < 1440) return `Starts in ${Math.round(m / 60)} h`;
  return `In ${Math.round(m / 1440)} days`;
}

function LiveClassesPage() {
  const { user, isTrainer, isAdmin, loading } = useAuth();
  const [room, setRoom] = useState<LiveSession | null>(null);
  const canHost = isTrainer || isAdmin;
  return (
    <>
      <PageHero eyebrow="Live classes" title="Learn live with your trainer" intro="Trainers schedule sessions with a Zoom or Whereby link. Enrolled students see them here and join in one click, from 15 minutes before the start." />
      <div className="mx-auto max-w-6xl px-5 py-10">
        {room && <WherebyRoom s={room} onClose={() => setRoom(null)} />}
        {loading ? <ListSkeleton /> : !user ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Video className="mx-auto size-8 text-brand-gold" />
            <p className="mt-3 text-lg">Sign in to see your live classes.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/login">Log in</Link></Button>
          </div>
        ) : (
          <div className={canHost ? "grid gap-8 lg:grid-cols-[380px_1fr]" : ""}>
            {canHost && <ScheduleForm userId={user.id} />}
            <SessionList userId={user.id} canHost={canHost} isAdmin={isAdmin} onOpenRoom={setRoom} />
          </div>
        )}
      </div>
    </>
  );
}

function ScheduleForm({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ slug: courses[0]!.slug, title: "", starts_at: "", duration_min: "60", meeting_url: "" });
  const add = async () => {
    if (!f.title.trim() || !f.starts_at) return void toast.error("Add a title and start time.");
    if (!okLink(f.meeting_url.trim())) return void toast.error("Paste a Zoom or Whereby link (Google Meet and Teams also work).");
    if (new Date(f.starts_at).getTime() < Date.now() - 60000) return void toast.error("Pick a start time in the future.");
    const { error } = await supabase.from("live_sessions").insert({ course_slug: f.slug, trainer_id: userId, title: f.title.trim(), starts_at: new Date(f.starts_at).toISOString(), duration_min: Math.min(480, Math.max(15, Number(f.duration_min) || 60)), meeting_url: safeHref(f.meeting_url.trim()) });
    if (error) return void toast.error(error.message);
    toast.success("Live class scheduled. Enrolled students can see it now.");
    setF({ ...f, title: "", starts_at: "", meeting_url: "" });
    void qc.invalidateQueries({ queryKey: ["live-classes"] });
  };
  return (
    <div className="h-fit space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-serif text-2xl text-brand-navy"><CalendarClock className="size-5 text-brand-gold" />Schedule a class</h2>
      <select className={sel} value={f.slug} onChange={e => setF({ ...f, slug: e.target.value })}>{courses.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}</select>
      <Input placeholder="Class title, e.g. Live demo: bridal makeup" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <Input type="datetime-local" value={f.starts_at} onChange={e => setF({ ...f, starts_at: e.target.value })} />
        <Input type="number" min={15} max={480} value={f.duration_min} onChange={e => setF({ ...f, duration_min: e.target.value })} aria-label="Minutes" />
      </div>
      <Input placeholder="https://zoom.us/j/… or https://whereby.com/…" value={f.meeting_url} onChange={e => setF({ ...f, meeting_url: e.target.value })} />
      <p className="text-xs text-muted-foreground">Create the meeting in Zoom or Whereby first, then paste its link. Whereby rooms can also open right on this page.</p>
      <Button className="w-full rounded-full" onClick={() => void add()}>Schedule class</Button>
    </div>
  );
}

function SessionList({ userId, canHost, isAdmin, onOpenRoom }: { userId: string; canHost: boolean; isAdmin: boolean; onOpenRoom: (s: LiveSession) => void }) {
  const qc = useQueryClient();
  const now = useNow();
  const { data = [], isLoading } = useQuery({
    queryKey: ["live-classes", userId],
    queryFn: async () => ((await supabase.from("live_sessions").select("*").gte("starts_at", new Date(Date.now() - 7 * 864e5).toISOString()).order("starts_at")).data ?? []) as LiveSession[],
  });
  const cancel = async (id: string) => { await supabase.from("live_sessions").update({ status: "cancelled" }).eq("id", id); void qc.invalidateQueries({ queryKey: ["live-classes"] }); };
  const upcoming = data.filter(s => ["open", "soon"].includes(phase(s, now)));
  const past = data.filter(s => ["ended", "cancelled"].includes(phase(s, now))).reverse();
  if (isLoading) return <ListSkeleton />;
  return (
    <div>
      <h2 className="font-serif text-2xl text-brand-navy">Upcoming classes</h2>
      {upcoming.length === 0 && <p className="mt-3 rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{canHost ? "Nothing scheduled yet. Use the form to add your first class." : "No live classes scheduled for your courses yet. Your trainer will add them here."}</p>}
      <ul className="mt-4 space-y-3">{upcoming.map(s => {
        const p = phase(s, now); const mine = s.trainer_id === userId; const plat = platformOf(s.meeting_url);
        return (
          <li key={s.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold">{startsIn(s, now)}{plat && ` · ${plat}`}</p>
              <p className="mt-1 font-semibold text-brand-navy">{s.title}</p>
              <p className="text-sm text-muted-foreground">{courseName(s.course_slug)} · {fmtDateTime(s.starts_at)} · {s.duration_min} min</p>
              {mine ? <SessionRequests sessionId={s.id} /> : <SessionBookButton sessionId={s.id} userId={userId} startsAt={s.starts_at} />}
            </div>
            <div className="flex flex-wrap gap-2">
              {s.meeting_url && (p === "open" || mine) && (
                <Button asChild className="rounded-full"><a href={s.meeting_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />{mine ? "Start & host" : "Join class"}</a></Button>
              )}
              {s.meeting_url && plat === "Whereby" && (p === "open" || mine) && <Button variant="outline" className="rounded-full" onClick={() => onOpenRoom(s)}>Open here</Button>}
              {p === "soon" && !mine && <span className="self-center text-xs text-muted-foreground">Join opens 15 min before</span>}
              {(mine || isAdmin) && <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void cancel(s.id)}>Cancel</Button>}
            </div>
          </li>
        );
      })}</ul>
      {past.length > 0 && <>
        <h3 className="mt-10 font-serif text-xl text-brand-navy">Past 7 days</h3>
        <ul className="mt-3 space-y-2">{past.map(s => <li key={s.id} className="rounded-md border border-border p-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">{s.title}</span> · {courseName(s.course_slug)} · {fmtDateTime(s.starts_at)} · <span className="capitalize">{phase(s, now)}</span></li>)}</ul>
      </>}
    </div>
  );
}

function WherebyRoom({ s, onClose }: { s: LiveSession; onClose: () => void }) {
  return (
    <div className="mb-8 overflow-hidden rounded-xl border border-border bg-brand-navy">
      <div className="flex items-center justify-between px-4 py-2 text-primary-foreground">
        <p className="text-sm font-semibold">{s.title}</p>
        <button onClick={onClose} aria-label="Close room"><X className="size-5" /></button>
      </div>
      <iframe src={`${s.meeting_url}${s.meeting_url!.includes("?") ? "&" : "?"}embed`} allow="camera; microphone; fullscreen; speaker; display-capture; autoplay" className="h-[70vh] w-full bg-background" title="Live class room" />
    </div>
  );
}
