import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community-ui";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, countOf, memberTypes, suggestedTags, type PostRow } from "@/lib/community";

export const Route = createFileRoute("/community/")({
  validateSearch: z.object({ tag: z.string().optional(), sort: z.enum(["latest", "top"]).optional(), who: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "SOQ Community | Tips, stories and careers from the SOQ ecosystem" },
      { name: "description", content: "Join students, alumni, trainers and industry partners sharing tips, career stories and advice in beauty, wellness, AI and business." },
      { property: "og:title", content: "SOQ Community" },
      { property: "og:description", content: "Posts and conversations from SOQ students, alumni, trainers and partners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Community,
});

function Community() {
  const { tag, sort = "latest", who } = Route.useSearch();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts", tag, who],
    queryFn: async () => {
      let q = supabase.from("posts").select(POST_SELECT).order("created_at", { ascending: false }).limit(60);
      if (tag) q = q.contains("tags", [tag]);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PostRow[];
    },
  });
  const list = posts
    .filter(p => !who || p.author?.member_type === who)
    .sort((a, b) => sort === "top" ? countOf(b.post_likes) + countOf(b.post_comments) - countOf(a.post_likes) - countOf(a.post_comments) : 0);

  const pill = (active: boolean) => `rounded-full px-4 py-1.5 text-sm ${active ? "bg-brand-navy text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <>
      <section className="bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-6 px-5 py-14 lg:px-8">
          <div>
            <p className="font-script text-3xl text-brand-gold">Learn together, grow together</p>
            <h1 className="mt-2 font-serif text-5xl text-primary md:text-6xl">SOQ Community</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">Tips, career stories and advice from students, alumni, trainers and industry partners.</p>
          </div>
          <Button asChild className="h-12 rounded-full bg-brand-gold px-6 text-brand-navy hover:bg-brand-gold/85"><Link to="/community/new"><PenLine /> Write a post</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr_260px] lg:px-8">
        <aside className="grid content-start gap-1">
          <p className="eyebrow mb-2">From</p>
          <Link to="/community" search={{ tag, sort }} className={pill(!who)}>Everyone</Link>
          {Object.entries(memberTypes).map(([k, v]) => <Link key={k} to="/community" search={{ tag, sort, who: k }} className={pill(who === k)}>{v}s</Link>)}
        </aside>
        <div>
          <div className="mb-5 flex items-center gap-2">
            <Link to="/community" search={{ tag, who }} className={pill(sort === "latest")}>Latest</Link>
            <Link to="/community" search={{ tag, who, sort: "top" }} className={pill(sort === "top")}>Top</Link>
            {tag && <span className="ml-auto text-sm">Showing <strong>#{tag}</strong> · <Link to="/community" search={{ sort, who }} className="underline">clear</Link></span>}
          </div>
          {isLoading ? <p className="text-muted-foreground">Loading posts…</p> : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <h2 className="font-serif text-3xl text-primary">No posts here yet</h2>
              <p className="mt-2 text-muted-foreground">Be the first to share something with the SOQ community.</p>
              <Button asChild className="mt-5 rounded-full"><Link to="/community/new">Write the first post</Link></Button>
            </div>
          ) : <div className="grid gap-4">{list.map(p => <PostCard key={p.id} post={p} />)}</div>}
        </div>
        <aside className="grid content-start gap-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="eyebrow mb-3">Popular topics</p>
            <div className="flex flex-wrap gap-2">{suggestedTags.map(t => <Link key={t} to="/community" search={{ tag: t, sort, who }} className="rounded-md bg-muted px-2 py-1 text-sm hover:text-brand-gold">#{t}</Link>)}</div>
          </div>
          <div className="rounded-lg bg-brand-navy p-5 text-primary-foreground">
            <h3 className="font-serif text-2xl">Community guidelines</h3>
            <ul className="mt-3 grid gap-2 text-sm text-primary-foreground/75">
              <li>Be kind and respectful.</li><li>Share real experience, not spam.</li><li>No personal details of clients or classmates.</li><li>Staff may hide posts that break these rules.</li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
