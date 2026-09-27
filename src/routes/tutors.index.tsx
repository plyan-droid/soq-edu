import { ListSkeleton } from "@/components/start-here";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { TutorAvatar } from "@/components/tutor-avatar";
import { supabase } from "@/integrations/supabase/client";
import { TUTOR_COLS, type OpenSlot, type PublicTutor } from "@/lib/tutors";

export const Route = createFileRoute("/tutors/")({
  head: () => ({ meta: [
    { title: "1-to-1 Tutors | SOQ International Academy" },
    { name: "description", content: "Browse SOQ trainers and book a private 1-to-1 session for coaching, revision or career advice." },
    { property: "og:title", content: "Book a 1-to-1 tutor at SOQ" },
    { property: "og:description", content: "Meet SOQ trainers, see open times and prices, and book a private session." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: TutorsPage,
});

function TutorsPage() {
  const [filter, setFilter] = useState<"all" | "open" | "online">("all");
  const { data, isLoading } = useQuery({ queryKey: ["public-tutors"], queryFn: async () => {
    const [t, s] = await Promise.all([
      supabase.from("tutor_profiles").select(TUTOR_COLS).eq("visible", true).order("display_name"),
      supabase.from("meeting_slots").select("id,trainer_id,trainer_name,topic,starts_at,duration_min,price").is("booked_by", null).gte("starts_at", new Date().toISOString()).order("starts_at"),
    ]);
    return { tutors: (t.data ?? []) as PublicTutor[], slots: (s.data ?? []) as OpenSlot[] };
  } });
  const tutors = data?.tutors ?? []; const slots = data?.slots ?? [];
  const openCount = (id: string) => slots.filter(s => s.trainer_id === id).length;
  const shown = tutors.filter(t => filter === "all" || (filter === "open" ? openCount(t.user_id) > 0 : t.online));
  const tabs = [["all", `All tutors (${tutors.length})`], ["open", `Open this week (${tutors.filter(t => openCount(t.user_id) > 0).length})`], ["online", `Online (${tutors.filter(t => t.online).length})`]] as const;
  return (
    <>
      <PageHero eyebrow="1-to-1 sessions" title="Learn one-to-one with an SOQ trainer." intro="Anyone can book, not just enrolled students. Pick a tutor, choose an open time, and create a free account to confirm." />
      <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
        <div className="flex flex-wrap gap-5 border-b border-border pb-3 text-sm">{tabs.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={filter === k ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}>{l}</button>)}</div>
        {isLoading ? <ListSkeleton /> : shown.length === 0 ? <p className="mt-8 text-muted-foreground">No tutors listed here yet.</p> : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map(t => {
            const next = slots.find(s => s.trainer_id === t.user_id);
            return (
              <li key={t.user_id}>
                <Link to="/tutors/$id" params={{ id: t.user_id }} className="group flex h-64 flex-col justify-between rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand-gold hover:shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-sm text-foreground">{t.headline || t.subjects[0] || "SOQ trainer"}</p><p className="text-xs text-muted-foreground">{t.years_experience ? `${t.years_experience}+ yrs experience` : t.location}</p></div>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs text-primary">{next ? <><Star className="size-3 fill-brand-gold text-brand-gold" /> {openCount(t.user_id)} open</> : "No times yet"}</span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="font-serif text-3xl leading-tight text-primary">{t.display_name}</p>
                    <TutorAvatar name={t.display_name} photo={t.photo_url} />
                  </div>
                </Link>
              </li>
            );
          })}
            <li className="flex h-64 flex-col justify-between rounded-3xl bg-primary p-6 text-primary-foreground">
              <div className="flex items-start justify-between"><p className="text-sm">Not sure who to pick?</p><Link to="/tutor-finder" aria-label="Open tutor finder" className="grid size-10 place-items-center rounded-full border border-primary-foreground/40"><ArrowUpRight className="size-5" /></Link></div>
              <p className="font-serif text-3xl leading-tight">Answer three questions and we'll match you.</p>
            </li>
          </ul>
        )}
      </section>
    </>
  );
}
