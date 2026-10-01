import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { PenLine, CalendarDays, Flame } from "lucide-react";
import { CommunityMobileNav, CommunitySidebar, sections } from "@/components/community-sidebar";
import { courses } from "@/lib/site-content";
import type { Intake } from "@/lib/intakes";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community-ui";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, countOf, suggestedTags, type PostRow } from "@/lib/community";
import { CommunityEvents } from "@/components/upcoming-events";

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

  const { data: intakes = [] } = useQuery({
    queryKey: ["community-intakes"],
    queryFn: async () => ((await supabase.from("course_intakes").select("*").gte("start_date", new Date().toISOString().slice(0, 10)).order("start_date").limit(12)).data ?? []) as Intake[],
  });
  const byDay = Object.entries(intakes.slice(0, 5).reduce<Record<string, Intake[]>>((m, i) => { const k = fmt(i.start_date, true); (m[k] ??= []).push(i); return m; }, {}));
  const deadlines = intakes.filter(i => i.apply_by && new Date(i.apply_by) >= new Date(new Date().toDateString())).sort((a, b) => a.apply_by!.localeCompare(b.apply_by!)).slice(0, 4);
  const trending = [...posts].sort((a, b) => countOf(b.post_likes) + countOf(b.post_comments) * 2 - countOf(a.post_likes) - countOf(a.post_comments) * 2)[0];
  const section = sections.find(s => s.tag === tag);
  const pill = (active: boolean) => `rounded-full px-4 py-1.5 text-sm ${active ? "bg-brand-navy text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <>
      <section className="border-b border-border bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 lg:px-8">
          <div>
            <h1 className="font-serif text-4xl text-primary">SOQ Community</h1>
            <p className="text-sm text-muted-foreground">Tips, career stories and advice from students, alumni, trainers and industry partners.</p>
          </div>
          <Button asChild className="h-11 rounded-full bg-brand-gold px-6 text-brand-navy hover:bg-brand-gold/85"><Link to="/community/new"><PenLine /> Write a post</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr_260px] lg:px-8">
        <CommunitySidebar active={tag && sections.some(s => s.tag === tag) ? tag : tag ? "" : "home"} who={who} />
        <div>
          <CommunityMobileNav active={tag ?? "home"} />
          {section && <h2 className="mb-4 flex items-center gap-2 font-serif text-3xl text-primary"><section.Icon className="size-6 text-brand-gold" />{section.label}</h2>}
          <div className="mb-5 flex items-center gap-2">
            <Link to="/community" search={{ tag, who }} className={pill(sort === "latest")}>Latest</Link>
            <Link to="/community" search={{ tag, who, sort: "top" }} className={pill(sort === "top")}>Top</Link>
            {tag && !section && <span className="ml-auto text-sm">Showing <strong>#{tag}</strong> · <Link to="/community" search={{ sort, who }} className="underline">clear</Link></span>}
          </div>
          {isLoading ? <p className="text-muted-foreground">Loading posts…</p> : list.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-10 text-center">
              <h2 className="font-serif text-3xl text-primary">No posts here yet</h2>
              <p className="mt-2 text-muted-foreground">Be the first to share something with the SOQ community.</p>
              <Button asChild className="mt-5 rounded-full"><Link to="/community/new">Write the first post</Link></Button>
            </div>
          ) : <div className="grid gap-4">{list.map(p => <PostCard key={p.id} post={p} />)}</div>}
        </div>
        <aside className="grid content-start gap-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">What's happening at SOQ</p>
            <h3 className="mt-3 flex items-center gap-2 font-serif text-2xl text-primary"><CalendarDays className="size-5 text-brand-gold" /> Upcoming classes</h3>
            <div className="mt-3 rounded-md border border-border p-4">
              {intakes.length === 0 ? <p className="text-sm text-muted-foreground">New dates coming soon.</p> : byDay.map(([day, list]) => (
                <div key={day} className="mb-3 last:mb-0">
                  <p className="text-sm font-semibold text-primary">{day}</p>
                  <ul className="mt-1 grid gap-1 text-sm">{list.map(i => (
                    <li key={i.id}><Link to="/courses/$slug" params={{ slug: i.course_slug }} className="text-foreground/80 hover:text-brand-gold">{title(i.course_slug)}</Link>{i.status === "tentative" && <span className="text-xs text-muted-foreground"> · TBC</span>}</li>
                  ))}</ul>
                </div>
              ))}
            </div>
            <h3 className="mt-5 font-serif text-2xl text-primary">Apply-by deadlines</h3>
            <div className="mt-3 rounded-md border border-border p-4">
              {deadlines.length === 0 ? <p className="text-sm text-muted-foreground">No deadlines this month.</p> : deadlines.map(i => (
                <div key={i.id} className="mb-3 last:mb-0 text-sm">
                  <p className="font-semibold text-primary">{fmt(i.apply_by!)}</p>
                  <Link to="/courses/$slug" params={{ slug: i.course_slug }} className="text-foreground/80 hover:text-brand-gold">{title(i.course_slug)}</Link>
                </div>
              ))}
            </div>
            <Link to="/calendar" className="mt-3 inline-block text-sm font-medium text-primary underline">Full course calendar</Link>
          </div>
          <CommunityEvents />
          {trending && (
            <div className="rounded-lg bg-brand-navy p-5 text-primary-foreground">
              <p className="flex items-center gap-2 text-sm text-brand-gold"><Flame className="size-4" /> Trending now</p>
              <Link to="/community/post/$id" params={{ id: trending.id }} className="mt-2 block font-serif text-2xl leading-tight hover:text-brand-gold">{trending.title}</Link>
              <p className="mt-2 text-xs text-primary-foreground/70">{countOf(trending.post_likes)} likes · {countOf(trending.post_comments)} comments</p>
            </div>
          )}
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="eyebrow mb-3">Popular topics</p>
            <div className="flex flex-wrap gap-2">{suggestedTags.map(t => <Link key={t} to="/community" search={{ tag: t, sort, who }} className="rounded-md bg-muted px-2 py-1 text-sm hover:text-brand-gold">#{t}</Link>)}</div>
          </div>
        </aside>
      </section>
    </>
  );
}

const title = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const fmt = (d: string, weekday = false) => new Date(d + "T00:00:00").toLocaleDateString("en-SG", weekday ? { weekday: "long", day: "numeric", month: "long" } : { day: "numeric", month: "long" });

