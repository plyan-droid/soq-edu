import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";
import { money, priceNumber, useCart } from "@/lib/cart";

export const Route = createFileRoute("/bundles")({
  head: () => ({ meta: [
    { title: "Course Bundles | SOQ International Academy" },
    { name: "description", content: "Save when you take SOQ courses together. See current course bundles and bundle prices." },
    { property: "og:title", content: "SOQ Course Bundles" }, { property: "og:description", content: "Take SOQ courses together and save." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const cart = useCart();
  const { data = [], isLoading } = useQuery({ queryKey: ["bundles-public"], queryFn: async () => (await supabase.from("course_bundles").select("*").eq("active", true).order("created_at")).data ?? [] });
  return <>
    <PageHero eyebrow="Course bundles" title="Learn more, pay less." intro="Courses that go well together, at one bundle price." />
    <section className="mx-auto grid max-w-6xl gap-6 px-5 py-14 md:grid-cols-2 lg:px-8">
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : data.length === 0 ? <p className="text-muted-foreground">No bundles on offer right now. <Link to="/courses" className="underline">Browse courses</Link></p> :
        data.map(b => {
          const list = b.slugs.map(s => courses.find(c => c.slug === s)).filter(Boolean) as typeof courses;
          const full = list.reduce((s, c) => s + (priceNumber(c.price) ?? 0), 0);
          const key = `bundle-${b.id}`;
          return <article key={b.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex h-32">{list.slice(0, 4).map(c => <img key={c.slug} src={c.image} alt="" className="h-full min-w-0 flex-1 object-cover" loading="lazy" />)}</div>
            <div className="space-y-3 p-6"><h2 className="font-serif text-3xl text-primary">{b.name}</h2>{b.description && <p className="text-muted-foreground">{b.description}</p>}
              <ul className="list-disc pl-5 text-sm">{list.map(c => <li key={c.slug}><Link to="/courses/$slug" params={{ slug: c.slug }} className="hover:underline">{c.title}</Link></li>)}</ul>
              <p><span className="font-serif text-3xl text-primary">{money(Number(b.price))}</span>{full > Number(b.price) && <span className="ml-2 text-sm text-muted-foreground line-through">{money(full)}</span>}</p>
              <Button disabled={cart.has(key)} className="rounded-full" onClick={() => { cart.add({ slug: key, title: b.name, price: Number(b.price), label: `Bundle of ${list.length} courses`, includes: list.map(c => c.slug) }); toast.success("Bundle added to cart"); }}>{cart.has(key) ? "In your cart" : "Add bundle to cart"}</Button></div>
          </article>;
        })}
    </section></>;
}
