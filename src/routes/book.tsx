import { ListSkeleton } from "@/components/start-here";
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime, safeHref } from "@/lib/learning";

export const Route = createFileRoute("/book")({
  head: () => ({ meta: [
    { title: "Book a Trainer | SOQ International Academy" },
    { name: "description", content: "Book a 1-to-1 session with an SOQ trainer for coaching, revision or career advice." },
    { property: "og:title", content: "Book a 1-to-1 session with an SOQ trainer" },
    { property: "og:description", content: "Pick a free time slot and book your session with an SOQ trainer." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: BookPage,
});

function BookPage() {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState<Record<string, string>>({});
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["slots", user?.id], queryFn: async () => (await supabase.from("meeting_slots").select("*").gte("starts_at", new Date().toISOString()).order("starts_at")).data ?? [] });
  const book = async (id: string) => {
    const { error } = await supabase.rpc("book_slot", { _slot: id, _note: note[id] ?? "" });
    if (error) { toast.error(error.message); return; }
    toast.success("Booked! It's now in your list below."); void qc.invalidateQueries({ queryKey: ["slots"] });
  };
  const cancel = async (id: string) => { await supabase.rpc("cancel_booking", { _slot: id }); void qc.invalidateQueries({ queryKey: ["slots"] }); };
  const mine = data.filter(s => s.booked_by === user?.id);
  const free = data.filter(s => !s.booked_by);
  return (
    <>
      <PageHero eyebrow="1-to-1 sessions" title="Book time with a trainer." intro="Coaching, revision or career advice. Pick a free slot that suits you." />
      <section className="mx-auto max-w-5xl px-5 py-14 lg:px-8">
        {loading ? <ListSkeleton /> : !user ? <p><Link to="/login" className="text-primary underline">Log in</Link> to see free slots and book.</p> : <>
          {mine.length > 0 && <div className="mb-10"><h2 className="font-serif text-3xl text-primary">My bookings</h2><ul className="mt-4 space-y-2">{mine.map(s => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-gold bg-secondary p-4 text-sm"><span><b>{fmtDateTime(s.starts_at)}</b> · {s.duration_min} min with {s.trainer_name} · {s.topic}</span>
              <span className="flex gap-2">{s.meeting_url && <Button asChild size="sm"><a href={safeHref(s.meeting_url)} target="_blank" rel="noreferrer">Join</a></Button>}<Button size="sm" variant="outline" onClick={() => void cancel(s.id)}>Cancel</Button></span></li>))}</ul></div>}
          <h2 className="font-serif text-3xl text-primary">Free slots</h2>
          {free.length === 0 ? <p className="mt-4 text-muted-foreground">No free slots right now. Check back soon or message us on WhatsApp.</p> : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">{free.map(s => (
              <li key={s.id} className="rounded-lg border border-border bg-card p-5 text-sm">
                <p className="font-serif text-2xl text-primary">{s.trainer_name}</p>
                <p className="mt-1">{s.topic}</p>
                <p className="text-muted-foreground">{fmtDateTime(s.starts_at)} · {s.duration_min} min · {Number(s.price) > 0 ? `S$${s.price}` : "Free"}</p>
                <Input className="mt-3" placeholder="What would you like to cover? (optional)" value={note[s.id] ?? ""} onChange={e => setNote({ ...note, [s.id]: e.target.value })} maxLength={500} />
                <Button className="mt-3 rounded-full" onClick={() => void book(s.id)}>Book this slot</Button>
              </li>))}</ul>
          )}
          {free.some(s => Number(s.price) > 0) && <p className="mt-6 text-xs text-muted-foreground">For paid sessions, SOQ will contact you to arrange payment.</p>}
        </>}
      </section>
    </>
  );
}
