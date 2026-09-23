import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProfileSetup } from "@/components/community-ui";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { normaliseTags, suggestedTags, useMyCommunityProfile } from "@/lib/community";

export const Route = createFileRoute("/community/new")({
  head: () => ({
    meta: [
      { title: "Write a post | SOQ Community" },
      { name: "description", content: "Share a tip, story or question with the SOQ community." },
      { property: "og:title", content: "Write a post — SOQ Community" },
      { property: "og:description", content: "Share with SOQ students, alumni, trainers and partners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewPost,
});

function NewPost() {
  const { user, loading } = useAuth();
  const { data: profile, isLoading } = useMyCommunityProfile(user?.id);
  const navigate = useNavigate();
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [tags, setTags] = useState("");
  const [err, setErr] = useState<string | null>(null); const [busy, setBusy] = useState(false);

  if (loading || (user && isLoading)) return <div className="mx-auto max-w-3xl px-5 py-24 text-muted-foreground">Loading…</div>;
  if (!user) return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      <h1 className="font-serif text-4xl text-primary">Sign in to post</h1>
      <p className="mt-2 text-muted-foreground">Create a free account to share with the SOQ community.</p>
      <Button asChild className="mt-6 rounded-full"><Link to="/login" search={{ mode: "signup" }}>Join now</Link></Button>
    </div>
  );
  if (!profile) return <div className="px-5 py-16"><ProfileSetup userId={user.id} defaultName={(user.user_metadata["full_name"] as string | undefined) ?? user.email?.split("@")[0] ?? ""} /></div>;

  const publish = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (title.trim().length < 5) return setErr("Give your post a title of at least 5 characters.");
    if (body.trim().length < 20) return setErr("Your post needs at least 20 characters.");
    setBusy(true);
    const { data, error } = await supabase.from("posts").insert({ author_id: user.id, title: title.trim(), body: body.trim(), tags: normaliseTags(tags) }).select("id").single();
    setBusy(false);
    if (error || !data) return setErr("Couldn't publish. Please try again.");
    void navigate({ to: "/community/post/$id", params: { id: data.id } });
  };

  return (
    <form onSubmit={publish} className="mx-auto grid max-w-3xl gap-5 px-5 py-14">
      <h1 className="font-serif text-4xl text-primary">Write a post</h1>
      <Input className="h-14 font-serif text-2xl" placeholder="Post title" maxLength={150} value={title} onChange={e => setTitle(e.target.value)} />
      <div>
        <Input placeholder="Up to 4 tags, e.g. lashes careers" value={tags} onChange={e => setTags(e.target.value)} />
        <div className="mt-2 flex flex-wrap gap-2">{suggestedTags.map(t => (
          <button type="button" key={t} onClick={() => setTags(normaliseTags(`${tags} ${t}`).join(" "))} className="rounded-md bg-muted px-2 py-1 text-xs hover:text-brand-gold">#{t}</button>
        ))}</div>
      </div>
      <Textarea className="min-h-80 text-base leading-7" placeholder="Share your tip, story or question… (leave a blank line between paragraphs)" maxLength={20000} value={body} onChange={e => setBody(e.target.value)} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-3">
        <Button disabled={busy} className="rounded-full bg-brand-gold px-8 text-brand-navy hover:bg-brand-gold/85">Publish</Button>
        <Button asChild variant="ghost" className="rounded-full"><Link to="/community">Cancel</Link></Button>
      </div>
    </form>
  );
}
