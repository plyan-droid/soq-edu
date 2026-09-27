import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TutorAvatar } from "@/components/tutor-avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtDateTime } from "@/lib/learning";
import { TUTOR_COLS, type OpenSlot, type PublicTutor } from "@/lib/tutors";

export const Route = createFileRoute("/tutors/$id")({
  head: () => ({ meta: [
    { title: "Tutor profile | SOQ International Academy" },
    { name: "description", content: "See this SOQ trainer's experience, subjects and open times, and book a private 1-to-1 session." },
    { property: "og:title", content: "Book a 1-to-1 session with an SOQ trainer" },
    { property: "og:description", content: "Experience, subjects, open times and prices for this SOQ trainer." },
    { property: "og:type", content: "profile" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: TutorProfile,
});

function TutorProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["public-tutor", id], queryFn: async () => {
    const [t, s] = await Promise.all([
      supabase.from("tutor_profiles").select(TUTOR_COLS).eq("user_id", id).eq("visible", true).maybeSingle(),
      supabase.from("meeting_slots").select("id,trainer_id,trainer_name,topic,starts_at,duration_min,price").eq("trainer_id", id).is("booked_by", null).gte("starts_at", new Date().toISOString()).order("starts_at"),
    ]);
    return { tutor: t.data as PublicTutor | null, slots: (s.data ?? []) as OpenSlot[] };
  } });
  const book = async (slot: string) => {
    const { error } = await supabase.rpc("book_slot", { _slot: slot, _note: note });
    if (error) return void toast.error(error.message);
    toast.success("Booked! See it under My bookings on the Book page."); void qc.invalidateQueries({ queryKey: ["public-tutor", id] });
  };
  if (isLoading) return <p className="mx-auto max-w-6xl px-5 py-24 text-muted-foreground">Loading…</p>;
  const t = data?.tutor;
  if (!t) return <div className="mx-auto max-w-6xl px-5 py-24"><h1 className="font-serif text-4xl text-primary">Tutor not found</h1><Link to="/tutors" className="mt-4 inline-block underline">See all tutors</Link></div>;
  const slots = data?.slots ?? [];
  return (
    <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.1fr_1fr] lg:px-8">
      <div className="relative flex min-h-[28rem] flex-col items-center justify-center overflow-hidden rounded-3xl bg-secondary p-8">
        <TutorAvatar name={t.display_name} photo={t.photo_url} size="xl" />
        <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-border bg-background/85 p-5 backdrop-blur">
          <h1 className="font-serif text-4xl text-primary">{t.display_name}</h1>
          <p className="text-muted-foreground">{t.headline || t.subjects.join(", ")}{t.years_experience ? ` · ${t.years_experience}+ yrs experience` : ""}</p>
        </div>
      </div>
      <div>
        <Link to="/tutors" className="text-sm text-muted-foreground underline">All tutors</Link>
        <p className="mt-4 whitespace-pre-line">{t.bio}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">{t.subjects.map(s => <span key={s} className="rounded-full bg-secondary px-3 py-1 text-primary">{s}</span>)}</div>
        <p className="mt-3 text-sm text-muted-foreground">{[t.days.join(", "), t.times.join(", "), t.online ? "Online or " + t.location : t.location].filter(Boolean).join(" · ")}</p>
        <h2 className="mt-8 font-serif text-3xl text-primary">Open times</h2>
        {slots.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No open times right now. Check back soon.</p> : <>
          {user && <Input className="mt-3" placeholder="What would you like to cover? (optional)" value={note} onChange={e => setNote(e.target.value)} maxLength={500} />}
          <ul className="mt-3 space-y-2">{slots.map(s => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm">
              <span><b>{fmtDateTime(s.starts_at)}</b> · {s.duration_min} min · {s.topic}<br /><span className="text-muted-foreground">{Number(s.price) > 0 ? `S$${s.price}, paid to your tutor after booking` : "Free"}</span></span>
              {user ? <Button className="rounded-full" onClick={() => void book(s.id)}>Book</Button> : <Button asChild variant="outline" className="rounded-full"><Link to="/login">Sign up to book</Link></Button>}
            </li>))}</ul>
          {slots.some(s => Number(s.price) > 0) && <p className="mt-3 text-xs text-muted-foreground">Payment is arranged directly with your tutor by PayNow or bank transfer after booking.</p>}
        </>}
      </div>
    </section>
  );
}
