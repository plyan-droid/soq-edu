import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { categories, contact } from "@/lib/site-content";

export const Route = createFileRoute("/tutor-finder")({
  head: () => ({ meta: [
    { title: "Tutor Finder | SOQ International Academy" },
    { name: "description", content: "Answer three quick questions and find the SOQ trainer who fits your subject, schedule and location." },
    { property: "og:title", content: "Find your SOQ trainer" },
    { property: "og:description", content: "Match with an SOQ trainer by subject, time and location." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: TutorFinder,
});

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = ["Morning", "Afternoon", "Evening"];
const subjects: string[] = categories.map(c => c.name);

type Tutor = { user_id: string; display_name: string; headline?: string; years_experience?: number | null; bio: string; subjects: string[]; days: string[]; times: string[]; location: string; online: boolean; visible: boolean };

function Chips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return <div className="flex flex-wrap gap-2">{options.map(o => {
    const on = value.includes(o);
    return <button key={o} type="button" onClick={() => onChange(on ? value.filter(x => x !== o) : [...value, o])} className={`rounded-full border px-4 py-1.5 text-sm ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}>{o}</button>;
  })}</div>;
}

function TutorFinder() {
  const { user, isTrainer, isAdmin } = useAuth();
  const [step, setStep] = useState(0);
  const [subj, setSubj] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>([]);
  const [where, setWhere] = useState<"any" | "online" | "campus">("any");
  const { data: tutors = [] } = useQuery({ queryKey: ["tutors"], queryFn: async () => ((await supabase.from("tutor_profiles").select("*").eq("visible", true)).data ?? []) as Tutor[] });

  const scored = tutors.map(t => {
    let s = 0;
    s += t.subjects.filter(x => subj.includes(x)).length * 3;
    s += t.days.filter(x => days.includes(x)).length;
    s += t.times.filter(x => times.includes(x)).length;
    if (where === "online" && !t.online) s -= 5;
    return { t, s };
  }).filter(x => subj.length === 0 || x.t.subjects.some(s => subj.includes(s))).sort((a, b) => b.s - a.s);

  const steps = [
    { q: "What do you want to learn?", el: <Chips options={subjects} value={subj} onChange={setSubj} /> },
    { q: "Which days suit you?", el: <><Chips options={DAYS} value={days} onChange={setDays} /><div className="mt-4"><Chips options={TIMES} value={times} onChange={setTimes} /></div></> },
    { q: "Where would you like to learn?", el: <div className="flex flex-wrap gap-2">{([["any", "Either is fine"], ["online", "Online"], ["campus", "At the Anson Road campus"]] as const).map(([k, l]) => <button key={k} onClick={() => setWhere(k)} className={`rounded-full border px-4 py-1.5 text-sm ${where === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{l}</button>)}</div> },
  ];

  return (
    <>
      <PageHero eyebrow="Tutor Finder" title="Find the trainer who fits you." intro="Three quick questions. We'll match you by subject, schedule and location." />
      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
        {step < steps.length ? (
          <div className="rounded-lg border border-border bg-card p-8">
            <p className="text-xs font-semibold text-brand-gold">STEP {step + 1} OF {steps.length}</p>
            <h2 className="mt-2 font-serif text-3xl text-primary">{steps[step]!.q}</h2>
            <div className="mt-6">{steps[step]!.el}</div>
            <div className="mt-8 flex justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>
              <Button className="rounded-full" onClick={() => setStep(s => s + 1)}>{step === steps.length - 1 ? "Show my matches" : "Next"}</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between"><h2 className="font-serif text-3xl text-primary">Your matches</h2><Button variant="outline" onClick={() => setStep(0)}>Start again</Button></div>
            {scored.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">No trainers match yet. <a className="underline" href={`${contact.whatsapp}?text=${encodeURIComponent(`Hi SOQ, I'm looking for a trainer for ${subj.join(", ") || "a course"}.`)}`}>Ask us on WhatsApp</a> and we'll find one for you.</p>
            ) : <ul className="mt-6 grid gap-4 sm:grid-cols-2">{scored.map(({ t }) => (
              <li key={t.user_id} className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-serif text-2xl text-primary">{t.display_name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.subjects.join(" · ")}</p>
                {t.bio && <p className="mt-3 text-sm leading-6">{t.bio}</p>}
                <p className="mt-3 text-sm text-muted-foreground">{t.days.join(", ") || "Flexible days"} · {t.times.join(", ") || "Any time"}</p>
                <p className="text-sm text-muted-foreground">{t.location}{t.online ? " · Online available" : ""}</p>
                <Button asChild variant="outline" className="mt-4 mr-2 rounded-full"><Link to="/tutors/$id" params={{ id: t.user_id }}>View profile &amp; book</Link></Button><Button asChild className="mt-4 rounded-full"><a href={`https://wa.me/6587182308?text=${encodeURIComponent(`Hi SOQ, I'd like to learn with ${t.display_name} (${subj.join(", ")}).`)}`}>Ask about this trainer</a></Button>
              </li>))}</ul>}
          </div>
        )}
        {user && (isTrainer || isAdmin) && <p className="mt-10 text-center text-sm text-muted-foreground">Want to change your listing? Open <Link to="/trainer" search={{ tool: "profile" } as never} className="underline">Trainer workspace → Profile</Link>.</p>}
        {!user && <p className="mt-10 text-center text-sm text-muted-foreground">Are you an SOQ trainer? <Link to="/login" className="underline">Log in</Link> to list yourself here.</p>}
      </section>
    </>
  );
}
