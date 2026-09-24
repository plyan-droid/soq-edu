import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHero } from "@/components/page-hero";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { contact } from "@/lib/site-content";

export const Route = createFileRoute("/refer")({
  head: () => ({ meta: [
    { title: "Refer a Friend | SOQ International Academy" },
    { name: "description", content: "Share your personal SOQ link with friends and track who signs up and enrols." },
    { property: "og:title", content: "Refer a Friend to SOQ" }, { property: "og:description", content: "Share your SOQ link and track your referrals." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const label: Record<string, string> = { signed_up: "Signed up", enrolled: "Enrolled", rewarded: "Reward given" };

function Page() {
  const { user, loading } = useAuth(); const qc = useQueryClient();
  const { data: code } = useQuery({ enabled: !!user, queryKey: ["my-ref", user?.id], queryFn: async () => (await supabase.from("referral_codes").select("code").eq("user_id", user!.id).maybeSingle()).data?.code ?? null });
  const { data: refs = [] } = useQuery({ enabled: !!user, queryKey: ["my-refs", user?.id], queryFn: async () => (await supabase.from("referrals").select("*").eq("referrer_id", user!.id)).data ?? [] });
  const create = async () => {
    const c = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("referral_codes").insert({ user_id: user!.id, code: c });
    if (error) toast.error("Please try again."); void qc.invalidateQueries({ queryKey: ["my-ref"] });
  };
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/courses?ref=${code}` : "";
  return <>
    <PageHero eyebrow="Refer a friend" title="Know someone who'd love SOQ?" intro="Share your personal link. When your friend signs up and enrols, SOQ will be in touch about your thank-you reward." />
    <section className="mx-auto max-w-3xl space-y-6 px-5 py-14 lg:px-8">
      {loading ? null : !user ? <p><Link to="/login" className="underline">Log in</Link> to get your referral link.</p> : !code ?
        <Button className="rounded-full" onClick={() => void create()}>Get my referral link</Button> : <>
          <div className="rounded-lg border border-border bg-card p-6"><p className="text-sm text-muted-foreground">Your link</p><p className="mt-1 break-all font-medium text-primary">{link}</p>
            <div className="mt-4 flex flex-wrap gap-2"><Button className="rounded-full" onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied"); }}>Copy link</Button>
              <Button asChild variant="outline" className="rounded-full"><a href={`https://wa.me/?text=${encodeURIComponent(`I'm studying at SOQ International Academy — have a look: ${link}`)}`} target="_blank" rel="noreferrer">Share on WhatsApp</a></Button></div></div>
          <div><h2 className="font-serif text-3xl text-primary">Your referrals</h2>
            {refs.length === 0 ? <p className="mt-2 text-muted-foreground">No one has signed up with your link yet.</p> :
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">{refs.map(r => <li key={r.id} className="flex justify-between p-3"><span>{r.referred_email?.replace(/^(.).*(@.*)$/, "$1•••$2")}</span><span>{label[r.status]}</span></li>)}</ul>}</div>
        </>}
      <p className="text-sm text-muted-foreground">Questions about rewards? <a className="underline" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp SOQ</a>.</p>
    </section></>;
}
