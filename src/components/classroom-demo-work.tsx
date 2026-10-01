import { useState } from "react";
import { BookOpen, CheckCircle2, ClipboardList, FileText, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

type Topic = { topic: string; task: string; brief: string; answer: string; feedback: string };

function exampleFor(slug: string): Topic {
  if (slug.includes("aromatherapy")) return {
    topic: "Essential oils & consultation", task: "Client consultation case study",
    brief: "Review the sample client brief and explain how you would adapt an aromatherapy consultation. Include safety checks and aftercare advice.",
    answer: "I would begin by asking about allergies, medication, pregnancy and the client's goals. I would record their preferences, discuss contraindications and select an appropriate low-dilution blend. After the session, I would offer clear aftercare advice and schedule a follow-up.",
    feedback: "Clear consultation structure and sensible safety checks. Expand the rationale for your oil selection next time.",
  };
  if (slug.includes("brand")) return {
    topic: "Brand narrative", task: "Brand story outline",
    brief: "Create a short brand narrative for a fictional local business. Describe its audience, core promise and voice.",
    answer: "My fictional neighbourhood bakery serves busy families who value familiar flavours. Its promise is fresh, thoughtful baking for everyday moments. The story uses a warm, confident voice and focuses on the people behind each loaf.",
    feedback: "A strong audience and tone. Add one specific example of how this voice appears in a campaign.",
  };
  return {
    topic: "Applied practice", task: "Learning reflection",
    brief: "Write a short reflection on an idea from this course and explain how you would apply it to a realistic scenario.",
    answer: "I chose one practical idea from the module and tested it against a fictional client scenario. I set a clear goal, identified the information I would need and described how I would measure whether my approach worked.",
    feedback: "Thoughtful application to a scenario. Include a more concrete measure of success in your next draft.",
  };
}

export function DemoStreamWork({ slug, openClasswork }: { slug: string; openClasswork: () => void }) {
  const example = exampleFor(slug);
  return <section className="mb-7 space-y-3" aria-label="Sample class activity">
    <p className="text-xs font-semibold uppercase text-muted-foreground">[DEMO] Sample class activity</p>
    <div className="rounded-md border border-border bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><MessageSquareText className="size-4 shrink-0" /> [DEMO] Trainer · Class update</p>
      <h3 className="mt-3 font-serif text-xl text-primary">Welcome to {example.topic}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">This week, explore the class materials and review the case study in Classwork. The example below shows what handed-in work and feedback look like.</p>
    </div>
    <div className="rounded-md border border-border bg-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><ClipboardList className="size-4 shrink-0" /> [DEMO] Assignment posted</p>
      <h3 className="mt-3 font-serif text-xl text-primary">{example.task}</h3>
      <p className="mt-2 text-sm text-muted-foreground">Example submitted work and trainer feedback are available to view.</p>
      <Button className="mt-3 px-0" variant="link" onClick={openClasswork}>View sample classwork →</Button>
    </div>
  </section>;
}

export function DemoClasswork({ slug, expanded, onToggle }: { slug: string; expanded: boolean; onToggle: () => void }) {
  const example = exampleFor(slug);
  return <section className="mb-7" aria-label="Sample classwork">
    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">[DEMO] Sample classwork</p>
    <h2 className="border-b border-border pb-3 font-serif text-2xl text-primary">{example.topic}</h2>
    <Button variant="ghost" className="mt-1 h-auto min-h-14 w-full justify-start gap-3 whitespace-normal px-2 text-left" onClick={onToggle} aria-expanded={expanded}>
      <ClipboardList className="size-5 shrink-0 text-brand-gold" /><span className="min-w-0 flex-1">{example.task}</span><span className="shrink-0 text-xs text-muted-foreground">Sample returned work</span>
    </Button>
    {expanded && <div className="rounded-md border border-border bg-muted/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>[DEMO] Example assignment</span><span>Returned · sample mark 8/10</span></div>
      <p className="mt-4 text-sm leading-6">{example.brief}</p>
      <div className="mt-5 border-t border-border pt-4">
        <h3 className="font-serif text-xl text-primary">Your work <span className="font-sans text-xs text-muted-foreground">(sample, not your submission)</span></h3>
        <div className="mt-3 rounded-md border border-border bg-card p-4"><p className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4 shrink-0 text-brand-gold" /> Example response</p><p className="mt-3 text-sm leading-6">{example.answer}</p></div>
        <p className="mt-4 text-sm"><strong>Sample trainer feedback:</strong> {example.feedback}</p>
      </div>
    </div>}
    <div className="mt-5 border-b border-border pb-3"><p className="flex items-center gap-2 text-sm text-muted-foreground"><BookOpen className="size-4 shrink-0" /> [DEMO] Material · Consultation and reflection guide</p></div>
  </section>;
}

export function DemoGrades({ slug, openClasswork }: { slug: string; openClasswork: () => void }) {
  const example = exampleFor(slug);
  return <section className="mt-7 border-t border-border pt-5" aria-label="Sample grade">
    <p className="text-xs font-semibold uppercase text-muted-foreground">[DEMO] Example only · not your grade</p>
    <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><p className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 shrink-0 text-brand-gold" />{example.task}</p><p className="mt-1 text-xs text-muted-foreground">Sample handed-in work · Returned with feedback</p></div><span className="text-sm font-semibold text-primary">8/10</span></div>
    <p className="mt-3 text-sm text-muted-foreground">{example.feedback}</p>
    <Button variant="link" className="mt-2 px-0" onClick={openClasswork}>View example submission →</Button>
  </section>;
}