import { ListSkeleton } from "@/components/start-here";
import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { useNotices } from "@/components/learner-tools";

export const Route = createFileRoute("/noticeboard")({
  head: () => ({ meta: [
    { title: "Noticeboard | SOQ International Academy" },
    { name: "description", content: "Latest announcements from SOQ International Academy: intakes, closures and student news." },
    { property: "og:title", content: "SOQ Noticeboard" }, { property: "og:description", content: "Latest announcements from SOQ International Academy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { data = [], isLoading } = useNotices();
  return <>
    <PageHero eyebrow="Noticeboard" title="News from SOQ." intro="Announcements about intakes, public holidays, campus updates and student life." />
    <section className="mx-auto max-w-4xl space-y-4 px-5 py-14 lg:px-8">
      {isLoading ? <ListSkeleton /> : data.length === 0 ? <p className="text-muted-foreground">No notices right now.</p> :
        data.map(n => <article key={n.id} className="rounded-lg border border-border bg-card p-6">
          <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-gold"><Megaphone className="size-4" />{n.pinned ? "Pinned" : new Date(n.created_at).toLocaleDateString("en-SG", { dateStyle: "long" })}</p>
          <h2 className="mt-2 font-serif text-3xl text-primary">{n.title}</h2>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{n.body}</p></article>)}
    </section></>;
}
