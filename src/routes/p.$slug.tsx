import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PostBody } from "@/components/post-body";

export const Route = createFileRoute("/p/$slug")({
  head: () => ({
    meta: [
      { title: "SOQ International Academy" },
      { name: "description", content: "Information from SOQ International Academy, Singapore." },
      { property: "og:title", content: "SOQ International Academy" },
      { property: "og:description", content: "Information from SOQ International Academy, Singapore." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SitePage,
});

function SitePage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["site-page", slug], queryFn: async () => (await supabase.from("site_pages").select("title,body,published").eq("slug", slug).maybeSingle()).data });
  if (isLoading) return <div className="mx-auto max-w-3xl px-5 py-20 text-muted-foreground">Loading…</div>;
  if (!data) return <div className="mx-auto max-w-3xl px-5 py-20"><h1 className="font-serif text-4xl text-primary">Page not found</h1><Link to="/" className="mt-4 inline-block underline">Go home</Link></div>;
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      {!data.published && <p className="mb-4 rounded bg-brand-gold-soft px-3 py-2 text-sm">Draft — only staff can see this page.</p>}
      <h1 className="font-serif text-5xl text-primary">{data.title}</h1>
      <div className="mt-8"><PostBody body={data.body} /></div>
    </article>
  );
}
