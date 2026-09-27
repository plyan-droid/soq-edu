import { ListSkeleton } from "@/components/start-here";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community-ui";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, type PostRow } from "@/lib/community";

export const Route = createFileRoute("/community/saved")({
  head: () => ({
    meta: [
      { title: "Saved posts | SOQ Community" },
      { name: "description", content: "Posts you have saved in the SOQ Community to read again later." },
      { property: "og:title", content: "Saved posts — SOQ Community" },
      { property: "og:description", content: "Your reading list from the SOQ Community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Saved,
});

function Saved() {
  const { user, loading } = useAuth();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["saved-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("post_bookmarks").select(`created_at, post:posts(${POST_SELECT})`).eq("user_id", user!.id).order("created_at", { ascending: false });
      return ((data ?? []) as unknown as { post: PostRow | null }[]).map(r => r.post).filter((p): p is PostRow => !!p);
    },
  });
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr] lg:px-8">
      <CommunitySidebar active="saved" />
      <div>
        <CommunityMobileNav active="saved" />
        <h1 className="font-serif text-4xl text-primary">Saved posts</h1>
        {loading ? null : !user ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">Sign in to save posts and read them later.</p>
            <Button asChild className="mt-4 rounded-full"><Link to="/login">Log in</Link></Button>
          </div>
        ) : isLoading ? <ListSkeleton /> : posts.length === 0 ? (
          <p className="mt-6 text-muted-foreground">You haven't saved any posts yet. Tap the bookmark on any post to keep it here.</p>
        ) : <div className="mt-6 grid gap-4">{posts.map(p => <PostCard key={p.id} post={p} />)}</div>}
      </div>
    </section>
  );
}
