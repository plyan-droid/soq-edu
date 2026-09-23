import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHero } from "@/components/page-hero";
import { CompareToggle } from "@/components/course-card";
import { courses } from "@/lib/site-content";
import { recommendCourses } from "@/lib/recommend.functions";

export const Route = createFileRoute("/recommend")({
  head: () => ({
    meta: [
      { title: "Find My Course — AI Course Advisor | SOQ International Academy" },
      { name: "description", content: "Describe your learning goals and get personalised SOQ course recommendations in seconds." },
      { property: "og:title", content: "Find My Course — SOQ AI Course Advisor" },
      { property: "og:description", content: "Tell us your goals and get matched with the most relevant SOQ courses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecommendPage,
});

const examples = [
  "I'm a mid-career admin worker wanting to switch into beauty and start my own lash business.",
  "I run a small F&B shop and want to use AI to market it on social media.",
  "I want an internationally recognised diploma in wellness that I can study part-time.",
];

type Result = { summary: string; recommendations: { slug: string; reason: string }[] };

function RecommendPage() {
  const recommend = useServerFn(recommendCourses);
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (goals.trim().length < 10) return setError("Please tell us a little more (at least 10 characters).");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await recommend({ data: { goals } }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHero eyebrow="AI course advisor" title="Tell us your goals. We'll find your course." intro="Describe where you are today and where you want to go — our AI advisor matches you with the most relevant SOQ programmes." />
      <section className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6">
          <label htmlFor="goals" className="font-serif text-2xl text-brand-navy">What do you want to learn or achieve?</label>
          <Textarea id="goals" value={goals} onChange={(e) => setGoals(e.target.value)} maxLength={1500} rows={5} className="mt-4" placeholder="e.g. I want to become a certified makeup artist and work on weddings…" />
          <div className="mt-3 flex flex-wrap gap-2">
            {examples.map((ex) => (
              <button key={ex} type="button" onClick={() => setGoals(ex)} className="rounded-full bg-brand-gold-soft px-3 py-1.5 text-left text-xs text-brand-navy hover:bg-brand-gold/40">{ex}</button>
            ))}
          </div>
          <Button type="submit" disabled={loading} className="mt-6 h-11 rounded-full bg-brand-gold px-6 text-brand-navy hover:bg-brand-gold/85">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? "Finding your best matches…" : "Recommend courses"}
          </Button>
          {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        </form>

        {result && (
          <div className="mt-10">
            <p className="eyebrow">Your matches</p>
            <p className="mt-2 text-lg text-foreground/80">{result.summary}</p>
            {result.recommendations.length === 0 && <p className="mt-6 text-muted-foreground">No close matches found — try describing your goals differently, or <Link to="/contact" className="text-primary underline">speak to an advisor</Link>.</p>}
            <ol className="mt-6 space-y-4">
              {result.recommendations.map((r, i) => {
                const c = courses.find((x) => x.slug === r.slug);
                if (!c) return null;
                return (
                  <li key={r.slug} className="flex gap-5 rounded-lg border border-border bg-card p-5">
                    <img src={c.image} alt="" width={160} height={120} className="hidden h-28 w-36 rounded object-cover sm:block" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-brand-gold">#{i + 1} · {c.category}</span>
                      <h3 className="mt-1 font-serif text-xl text-brand-navy"><Link to="/courses/$slug" params={{ slug: c.slug }} className="hover:underline">{c.title}</Link></h3>
                      <p className="mt-2 text-sm text-foreground/80">{r.reason}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{c.duration}</span><span>·</span><span>{c.mode}</span><span>·</span><strong className="text-primary">{c.price}</strong>
                        <CompareToggle slug={c.slug} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {result.recommendations.length > 1 && <Button asChild variant="outline" className="mt-6 rounded-full"><Link to="/compare">Compare selected courses</Link></Button>}
          </div>
        )}
      </section>
    </>
  );
}
