import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Review = { id: string; user_id: string; reviewer_name: string; rating: number; body: string; created_at: string };

export function CourseReviews({ slug }: { slug: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["reviews", slug];
  const { data = [] } = useQuery({
    queryKey: key,
    queryFn: async () => ((await supabase.from("course_reviews").select("id,user_id,reviewer_name,rating,body,created_at").eq("course_slug", slug).eq("hidden", false).order("created_at", { ascending: false })).data ?? []) as Review[],
  });
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const mine = data.find(r => r.user_id === user?.id);
  const avg = data.length ? data.reduce((s, r) => s + r.rating, 0) / data.length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const text = body.trim();
    if (text.length < 10 || text.length > 2000) { setErr("Please write 10–2000 characters."); return; }
    const name = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Learner";
    const { error } = await supabase.from("course_reviews").insert({ course_slug: slug, user_id: user!.id, reviewer_name: name.slice(0, 80), rating, body: text });
    if (error) { setErr("Couldn't post your review."); return; }
    setBody(""); void qc.invalidateQueries({ queryKey: key });
  };

  return (
    <section className="mx-auto max-w-4xl px-5 pb-16 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-serif text-4xl text-primary">Learner reviews</h2>
        {data.length > 0 && <p className="flex items-center gap-2 text-sm"><Stars n={Math.round(avg)} /> {avg.toFixed(1)} · {data.length} review{data.length > 1 ? "s" : ""}</p>}
      </div>
      {data.length === 0 && <p className="mt-3 text-muted-foreground">No reviews yet.</p>}
      <div className="mt-6 grid gap-4">
        {data.map(r => (
          <article key={r.id} className="rounded-lg border border-border p-5">
            <div className="flex items-center justify-between"><strong className="text-primary">{r.reviewer_name}</strong><Stars n={r.rating} /></div>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-foreground/80">{r.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-SG")}</p>
          </article>
        ))}
      </div>
      {!user ? <p className="mt-6 text-sm"><Link to="/login" className="font-semibold text-primary underline">Log in</Link> to write a review.</p>
        : mine ? <p className="mt-6 text-sm text-muted-foreground">Thanks for reviewing this course.</p>
        : (
          <form onSubmit={submit} className="mt-6 grid gap-3 rounded-lg bg-brand-cream p-5">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-label={`${n} stars`} onClick={() => setRating(n)}><Star className={`size-6 ${n <= rating ? "fill-brand-gold text-brand-gold" : "text-muted-foreground"}`} /></button>)}</div>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={2000} placeholder="What did you learn? Would you recommend it?" className="rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <Button className="justify-self-start rounded-full">Post review</Button>
          </form>
        )}
    </section>
  );
}

function Stars({ n }: { n: number }) {
  return <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <Star key={i} className={`size-4 ${i <= n ? "fill-brand-gold text-brand-gold" : "text-muted-foreground/40"}`} />)}</span>;
}
