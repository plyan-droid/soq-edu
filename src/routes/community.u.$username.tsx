import { DetailSkeleton } from "@/components/start-here";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Avatar, MemberBadge, PostCard } from "@/components/community-ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, timeAgo, type CommunityProfile, type PostRow } from "@/lib/community";

export const Route = createFileRoute("/community/u/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} | SOQ Community` },
      { name: "description", content: `Posts and profile of @${params.username} in the SOQ community.` },
      { property: "og:title", content: `@${params.username} — SOQ Community` },
      { property: "og:description", content: "Member profile in the SOQ community." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["profile", username],
    queryFn: async () => {
      const { data: profile } = await supabase.from("community_profiles").select("*").eq("username", username).maybeSingle();
      if (!profile) return null;
      const { data: posts } = await supabase.from("posts").select(POST_SELECT).eq("author_id", profile.id).order("created_at", { ascending: false });
      return { profile: profile as CommunityProfile, posts: (posts ?? []) as unknown as PostRow[] };
    },
  });
  if (isLoading) return <DetailSkeleton />;
  if (!data) return <div className="mx-auto max-w-3xl px-5 py-24"><h1 className="font-serif text-4xl text-primary">Member not found</h1><Button asChild className="mt-5 rounded-full"><Link to="/community">Back to community</Link></Button></div>;
  const { profile, posts } = data;
  return (
    <>
      <section className="bg-brand-navy text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-14 text-center">
          <Avatar name={profile.display_name} size={88} />
          <h1 className="mt-4 font-serif text-5xl">{profile.display_name}</h1>
          <p className="mt-1 flex items-center gap-2 text-primary-foreground/70">@{profile.username} <MemberBadge type={profile.member_type} verified={profile.verified} /></p>
          {profile.bio && <p className="mt-4 max-w-xl text-primary-foreground/80">{profile.bio}</p>}
          <p className="mt-3 text-sm text-primary-foreground/60">Joined {timeAgo(profile.created_at)} · {posts.length} posts</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-3xl gap-4 px-5 py-12">
        {posts.length === 0 ? <p className="text-center text-muted-foreground">No posts yet.</p> : posts.map(p => <PostCard key={p.id} post={p} />)}
      </section>
    </>
  );
}
