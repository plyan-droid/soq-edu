import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bookmark, EyeOff, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, MemberBadge, ProfileSetup } from "@/components/community-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { POST_SELECT, readingTime, timeAgo, useMyCommunityProfile, type PostRow } from "@/lib/community";

export const Route = createFileRoute("/community/post/$id")({
  head: () => ({
    meta: [
      { title: "Community post | SOQ Community" },
      { name: "description", content: "Read and join the conversation in the SOQ community." },
      { property: "og:title", content: "SOQ Community post" },
      { property: "og:description", content: "A post from the SOQ community." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostPage,
});

type CommentRow = { id: string; body: string; created_at: string; author_id: string; hidden: boolean; author: { username: string; display_name: string; member_type: string; verified: boolean } | null };

function PostPage() {
  const { id } = Route.useParams();
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useMyCommunityProfile(user?.id);
  const [comment, setComment] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["post", id, user?.id],
    queryFn: async () => {
      const { data: post } = await supabase.from("posts").select(POST_SELECT).eq("id", id).maybeSingle();
      const { data: comments } = await supabase.from("post_comments").select("id,body,created_at,author_id,hidden,author:community_profiles!post_comments_author_id_fkey(username,display_name,member_type,verified)").eq("post_id", id).order("created_at");
      let liked = false, saved = false;
      if (user) {
        liked = !!(await supabase.from("post_likes").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle()).data;
        saved = !!(await supabase.from("post_bookmarks").select("post_id").eq("post_id", id).eq("user_id", user.id).maybeSingle()).data;
      }
      const likes = (await supabase.from("post_likes").select("post_id", { count: "exact", head: true }).eq("post_id", id)).count ?? 0;
      return { post: post as unknown as PostRow | null, comments: (comments ?? []) as unknown as CommentRow[], liked, saved, likes };
    },
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["post", id] });

  if (isLoading) return <div className="mx-auto max-w-3xl px-5 py-24 text-muted-foreground">Loading…</div>;
  const post = data?.post;
  if (!post) return <div className="mx-auto max-w-3xl px-5 py-24"><h1 className="font-serif text-4xl text-primary">Post not found</h1><Button asChild className="mt-5 rounded-full"><Link to="/community">Back to community</Link></Button></div>;

  const toggle = async (table: "post_likes" | "post_bookmarks", on: boolean) => {
    if (!user) return void navigate({ to: "/login" });
    if (on) await supabase.from(table).delete().eq("post_id", id).eq("user_id", user.id);
    else await supabase.from(table).insert({ post_id: id, user_id: user.id });
    refresh();
  };
  const addComment = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !comment.trim()) return;
    await supabase.from("post_comments").insert({ post_id: id, author_id: user.id, body: comment.trim() });
    setComment(""); refresh();
  };
  const canManage = user && (user.id === post.author_id || isAdmin);

  return (
    <article className="mx-auto max-w-3xl px-5 py-14">
      <Link to="/community" className="text-sm text-muted-foreground hover:text-primary">← Community</Link>
      {post.hidden && <p className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">This post is hidden by staff and only visible to you and admins.</p>}
      {post.tags.length > 0 && <div className="mt-6 flex flex-wrap gap-2">{post.tags.map(t => <Link key={t} to="/community" search={{ tag: t }} className="text-sm text-muted-foreground hover:text-brand-gold">#{t}</Link>)}</div>}
      <h1 className="mt-3 font-serif text-5xl leading-tight text-primary">{post.title}</h1>
      {post.author && (
        <Link to="/community/u/$username" params={{ username: post.author.username }} className="mt-6 flex items-center gap-3">
          <Avatar name={post.author.display_name} />
          <div>
            <p className="flex items-center gap-2 font-medium">{post.author.display_name} <MemberBadge type={post.author.member_type} verified={post.author.verified} /></p>
            <p className="text-sm text-muted-foreground">{timeAgo(post.created_at)} · {readingTime(post.body)} min read</p>
          </div>
        </Link>
      )}
      <div className="mt-8 grid gap-5 text-lg leading-8">{post.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-line">{para}</p>)}</div>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-border py-4">
        <Button variant={data.liked ? "default" : "outline"} className="rounded-full" onClick={() => void toggle("post_likes", data.liked)}><Heart className={data.liked ? "fill-current" : ""} /> {data.likes}</Button>
        <Button variant={data.saved ? "default" : "outline"} className="rounded-full" onClick={() => void toggle("post_bookmarks", data.saved)}><Bookmark className={data.saved ? "fill-current" : ""} /> {data.saved ? "Saved" : "Save"}</Button>
        {canManage && (
          <div className="ml-auto flex gap-2">
            {isAdmin && <Button variant="ghost" className="rounded-full" onClick={async () => { await supabase.from("posts").update({ hidden: !post.hidden }).eq("id", id); refresh(); }}><EyeOff /> {post.hidden ? "Unhide" : "Hide"}</Button>}
            <Button variant="ghost" className="rounded-full" onClick={async () => { if (!confirm("Delete this post?")) return; await supabase.from("posts").delete().eq("id", id); void navigate({ to: "/community" }); }}><Trash2 /> Delete</Button>
          </div>
        )}
      </div>

      <section className="mt-10">
        <h2 className="font-serif text-3xl text-primary">Discussion ({data.comments.length})</h2>
        {!user ? (
          <p className="mt-4 text-muted-foreground"><Link to="/login" className="text-primary underline">Sign in</Link> to join the discussion.</p>
        ) : !profile ? (
          <div className="mt-6"><ProfileSetup userId={user.id} defaultName={user.email?.split("@")[0] ?? ""} /></div>
        ) : (
          <form onSubmit={addComment} className="mt-5 grid gap-3">
            <Textarea placeholder="Add to the discussion" maxLength={3000} value={comment} onChange={e => setComment(e.target.value)} />
            <Button className="justify-self-start rounded-full" disabled={!comment.trim()}>Comment</Button>
          </form>
        )}
        <ul className="mt-8 grid gap-4">{data.comments.map(c => (
          <li key={c.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm">
              {c.author && <Link to="/community/u/$username" params={{ username: c.author.username }} className="font-medium">{c.author.display_name}</Link>}
              {c.author && <MemberBadge type={c.author.member_type} verified={c.author.verified} />}
              <span className="text-muted-foreground">· {timeAgo(c.created_at)}</span>
              {c.hidden && <span className="text-xs text-destructive">hidden</span>}
              {user && (user.id === c.author_id || isAdmin) && (
                <button className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Delete comment" onClick={async () => { await supabase.from("post_comments").delete().eq("id", c.id); refresh(); }}><Trash2 className="size-4" /></button>
              )}
            </div>
            <p className="mt-2 whitespace-pre-line leading-7">{c.body}</p>
          </li>
        ))}</ul>
      </section>
    </article>
  );
}
