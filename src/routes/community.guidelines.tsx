import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { contact } from "@/lib/site-content";

export const Route = createFileRoute("/community/guidelines")({
  head: () => ({
    meta: [
      { title: "Community guidelines | SOQ Community" },
      { name: "description", content: "How we keep the SOQ Community helpful and safe: respect, no spam, honest reviews, moderation and the Verified SOQ badge." },
      { property: "og:title", content: "SOQ Community guidelines" },
      { property: "og:description", content: "Respect, honesty and what the Verified SOQ badge means." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guidelines,
});

const rules = [
  ["Be respectful", "Everyone started somewhere. Critique work, never people. No harassment, hate or personal attacks."],
  ["No spam or hard selling", "Share what helps others. Promotions belong in Jobs & Gigs and must be genuine openings or services."],
  ["Honest reviews only", "Share real experiences of courses, trainers and employers. Don't post fake reviews or pretend to be someone else."],
  ["Protect privacy", "Don't post other people's photos, phone numbers or client details without permission. Before/after photos need the client's consent."],
  ["Stay on topic", "Beauty, wellness, AI, business, careers and study life. Ask & Answer is for questions, Showcase for your work."],
];

function Guidelines() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr] lg:px-8">
      <CommunitySidebar active="guidelines" />
      <div className="max-w-3xl">
        <CommunityMobileNav active="guidelines" />
        <h1 className="font-serif text-5xl text-primary">Community guidelines</h1>
        <p className="mt-3 text-lg text-muted-foreground">The SOQ Community is for students, alumni, trainers and businesses to learn from each other. A few simple rules keep it useful.</p>
        <ol className="mt-8 grid gap-5">
          {rules.map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <span className="font-serif text-3xl text-brand-gold">{i + 1}</span>
              <div><h2 className="font-serif text-2xl text-primary">{t}</h2><p className="mt-1 text-foreground/80">{d}</p></div>
            </li>
          ))}
        </ol>
        <h2 className="mt-10 font-serif text-3xl text-primary">How moderation works</h2>
        <p className="mt-2 text-foreground/80">Posts go live straight away. SOQ staff read the community and can hide or remove posts and comments that break these rules. To report something, email <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a> with the post link.</p>
        <div className="mt-10 rounded-lg bg-brand-navy p-6 text-primary-foreground">
          <h2 className="flex items-center gap-2 font-serif text-3xl text-brand-gold"><BadgeCheck /> The Verified SOQ badge</h2>
          <p className="mt-2 text-primary-foreground/85">Anyone can call themselves a Trainer or Business. Only members checked by SOQ staff get the Verified SOQ badge. If a trainer or business shows "unverified", treat their offers with care.</p>
        </div>
      </div>
    </section>
  );
}
