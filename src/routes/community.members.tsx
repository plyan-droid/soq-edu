import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Avatar, MemberBadge } from "@/components/community-ui";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { memberTypes, type CommunityProfile } from "@/lib/community";

export const Route = createFileRoute("/community/members")({
  validateSearch: z.object({ type: z.string().optional(), verified: z.boolean().optional() }),
  head: () => ({
    meta: [
      { title: "Members | SOQ Community" },
      { name: "description", content: "Meet SOQ students, alumni, trainers and partner businesses. Verified members are checked by SOQ staff." },
      { property: "og:title", content: "SOQ Community members" },
      { property: "og:description", content: "Students, alumni, verified trainers and partner businesses in the SOQ ecosystem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Members,
});

function Members() {
  const { type, verified } = Route.useSearch();
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["members", type, verified],
    queryFn: async () => {
      let q = supabase.from("community_profiles").select("*").order("created_at", { ascending: false }).limit(200);
      if (type) q = q.eq("member_type", type);
      if (verified) q = q.eq("verified", true);
      return ((await q).data ?? []) as CommunityProfile[];
    },
  });
  const chip = (a: boolean) => `rounded-full px-4 py-1.5 text-sm ${a ? "bg-brand-navy text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`;
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr] lg:px-8">
      <CommunitySidebar active="members" />
      <div>
        <CommunityMobileNav active="members" />
        <h1 className="font-serif text-4xl text-primary">Members</h1>
        <p className="mt-1 text-muted-foreground">Trainers and businesses with the Verified SOQ badge have been checked by SOQ staff.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/community/members" className={chip(!type && !verified)}>Everyone</Link>
          {Object.entries(memberTypes).filter(([k]) => k !== "member").map(([k, v]) => <Link key={k} to="/community/members" search={{ type: k }} className={chip(type === k)}>{v === "Alumni" || v === "Business" ? (v === "Business" ? "Businesses" : v) : `${v}s`}</Link>)}
          <Link to="/community/members" search={{ verified: true }} className={chip(!!verified)}>Verified</Link>
        </div>
        {isLoading ? <p className="mt-8 text-muted-foreground">Loading members…</p> : members.length === 0 ? <p className="mt-8 text-muted-foreground">No members match this filter yet.</p> : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {members.map(m => (
              <Link key={m.id} to="/community/u/$username" params={{ username: m.username }} className="flex gap-4 rounded-lg border border-border bg-card p-5 transition hover:border-brand-gold">
                <Avatar name={m.display_name} size={48} />
                <div className="min-w-0">
                  <p className="font-semibold text-primary">{m.display_name}</p>
                  <p className="text-sm text-muted-foreground">@{m.username}</p>
                  <div className="mt-1"><MemberBadge type={m.member_type} verified={m.verified} /></div>
                  {m.bio && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{m.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
