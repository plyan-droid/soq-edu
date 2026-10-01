import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, MessageCircle, BadgeCheck, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { countOf, memberTypes, readingTime, timeAgo, type PostRow } from "@/lib/community";

export function MemberBadge({ type, verified = false }: { type: string; verified?: boolean }) {
  const claimed = type === "trainer" || type === "business";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${claimed && !verified ? "bg-muted text-muted-foreground" : "bg-brand-gold-soft text-primary"}`} title={claimed && !verified ? "Not yet verified by SOQ staff" : undefined}>
        {memberTypes[type] ?? type}{claimed && !verified ? " · unverified" : ""}
      </span>
      {verified && <span className="inline-flex items-center gap-1 rounded-full bg-brand-navy px-2 py-0.5 text-[11px] font-semibold text-brand-gold" title="Verified by SOQ staff"><BadgeCheck className="size-3.5" /> Verified SOQ</span>}
    </span>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return <span style={{ width: size, height: size }} className="grid shrink-0 place-items-center rounded-full bg-brand-navy font-serif text-lg text-brand-gold">{name.charAt(0).toUpperCase()}</span>;
}

export function PostCard({ post, isStaff, onChanged }: { post: PostRow; isStaff?: boolean; onChanged?: () => void }) {
  const hide = async () => { await supabase.from("posts").update({ hidden: !post.hidden }).eq("id", post.id); onChanged?.(); };
  const del = async () => { if (!confirm("Delete this post permanently?")) return; await supabase.from("posts").delete().eq("id", post.id); onChanged?.(); };
  return (
    <article className="rounded-lg border border-border bg-card p-6 transition hover:border-brand-gold">
      {post.author && (
        <Link to="/community/u/$username" params={{ username: post.author.username }} className="flex items-center gap-3">
          <Avatar name={post.author.display_name} size={36} />
          <div>
            <p className="flex items-center gap-2 text-sm font-medium">{post.author.display_name} <MemberBadge type={post.author.member_type} verified={post.author.verified} /></p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</p>
          </div>
        </Link>
      )}
      <Link to="/community/post/$id" params={{ id: post.id }} className="mt-4 block">
        <h2 className="font-serif text-3xl leading-tight text-primary hover:text-brand-gold">{post.title}</h2>
        {post.hidden && <p className="mt-1 text-xs font-semibold text-destructive">Hidden by staff</p>}
      </Link>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">{post.tags.map(t => (
          <Link key={t} to="/community" search={{ tag: t }} className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-primary">#{t}</Link>
        ))}</div>
      )}
      <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5"><Heart className="size-4" />{countOf(post.post_likes)}</span>
        <span className="flex items-center gap-1.5"><MessageCircle className="size-4" />{countOf(post.post_comments)}</span>
        <span className="ml-auto">{readingTime(post.body)} min read</span>
        {isStaff && (
          <span className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary" aria-label={post.hidden ? "Unhide post" : "Hide post"} title={post.hidden ? "Unhide" : "Hide"} onClick={() => void hide()}><EyeOff className="size-4" />{post.hidden ? "Unhide" : "Hide"}</button>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-destructive" aria-label="Delete post" title="Delete" onClick={() => void del()}><Trash2 className="size-4" /></button>
          </span>
        )}
      </div>
    </article>
  );
}

export function ProfileSetup({ userId, defaultName }: { userId: string; defaultName: string }) {
  const qc = useQueryClient();
  const [display, setDisplay] = useState(defaultName);
  const [username, setUsername] = useState(defaultName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20));
  const [type, setType] = useState("member");
  const [bio, setBio] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    const { error } = await supabase.from("community_profiles").insert({ id: userId, username: username.toLowerCase(), display_name: display, member_type: type, bio: bio || null });
    if (error) setErr(error.code === "23505" ? "That username is taken — try another." : "Usernames need 3–30 letters, numbers or underscores.");
    else void qc.invalidateQueries({ queryKey: ["my-community-profile"] });
  };

  return (
    <form onSubmit={save} className="mx-auto grid max-w-lg gap-4 rounded-lg border border-border bg-card p-8">
      <h2 className="font-serif text-3xl text-primary">Set up your community profile</h2>
      <p className="text-sm text-muted-foreground">This is how other members will see you. Your email stays private.</p>
      <Input placeholder="Display name" value={display} onChange={e => setDisplay(e.target.value)} required />
      <Input placeholder="username" value={username} onChange={e => setUsername(e.target.value)} required />
      <label className="grid gap-1 text-sm">I am a…
        <select className="h-10 rounded-md border border-input bg-background px-3" value={type} onChange={e => setType(e.target.value)}>
          {Object.entries(memberTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <Textarea placeholder="Short bio (optional)" maxLength={500} value={bio} onChange={e => setBio(e.target.value)} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button className="rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85">Join the community</Button>
    </form>
  );
}
