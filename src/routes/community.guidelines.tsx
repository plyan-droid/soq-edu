import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Flag, MessageSquare, PenSquare, ShieldCheck, Users } from "lucide-react";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { contact } from "@/lib/site-content";

export const Route = createFileRoute("/community/guidelines")({
  head: () => ({
    meta: [
      { title: "Community guidelines | SOQ Community" },
      { name: "description", content: "How we keep the SOQ Community helpful and safe: rules for posts and comments, how moderation works, and what the Verified SOQ badge means." },
      { property: "og:title", content: "SOQ Community guidelines" },
      { property: "og:description", content: "Rules for posts, comments, moderation and the Verified SOQ badge." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Guidelines,
});

const postRules = [
  ["Write your own words", "Posts must be your own work. Don't copy another person's article, photo or video without credit and permission. If you quote a source, link it."],
  ["Title it honestly", "Your title should describe the post. No clickbait, ALL CAPS, or titles designed only to grab attention. Titles are 5–150 characters."],
  ["Post in the right section", "Ask & Answer for questions, Showcase for your work, Jobs & Gigs for openings, Stories for personal experience, Tech & AI for technical guides. Moderators may move posts that are in the wrong section."],
  ["Keep it safe for work", "No nudity, violence, or illegal content. Before-and-after treatment photos are welcome but must have client consent and stay clinical, not suggestive."],
  ["Promote only in Jobs & Gigs", "Hiring, services and course discounts go in Jobs & Gigs. Don't drop promotional links into other sections or repeat the same post across sections."],
  ["Tag fairly", "Use up to 4 tags that match the topic. Don't tag-spam (adding popular tags like #ai to a post that isn't about AI) just to reach more readers."],
  ["One account per person", "Don't create multiple accounts to like your own posts, argue with yourself, or get around a hidden post. Businesses should use one Business account."],
];

const commentRules = [
  ["Be constructive", "Disagree with the idea, not the person. "It's wrong because…" is fine. "You're stupid" is not."],
  ["Stay on the thread's topic", "If a post is about lash glue, talk about lash glue. Start a new post for a different subject."],
  ["No self-promotion in comments", "Comments are for discussion, not for advertising your course, salon or service. Use Jobs & Gigs for that."],
  ["Don't pile on", "If a comment is already hidden or flagged, don't reply just to add another insult. Report it and move on."],
];

const verifiedPoints = [
  "Anyone can choose the Trainer or Business label when they set up their profile. That label alone does not mean SOQ has checked them.",
  "The gold \"Verified SOQ\" badge is given only to Trainers and Businesses that SOQ staff have checked against real records — a current SOQ trainer, a partner salon, a registered business.",
  "Verified members are marked with a gold tick next to their name on posts, comments and their profile.",
  "If a Trainer or Business has no badge, they show as \"unverified\". Treat their offers, reviews and contact details with normal caution.",
  "SOQ does not verify Students, Alumni or Members — those labels are self-selected.",
  "Losing the badge: SOQ can remove a Verified badge if a member stops being a partner, posts misleading offers, or breaks these guidelines. Removal is not a punishment; it means the check no longer holds.",
  "How to get verified: once your profile is set up as a Trainer or Business, message SOQ staff (see below). Verification can take a few working days.",
];

const enforcement = [
  ["Posts go live straight away", "We trust members to post within the rules. Staff read the community and act on reports, usually within 1–2 working days."],
  ["What staff can do", "SOQ staff can hide a post or comment (it stays visible to the author), delete it, or remove a Verified badge. Staff manage all posts, comments and members, not just their own."],
  ["What gets removed", "Spam, harassment, false reviews, repeated promotion outside Jobs & Gigs, unsafe content, and anything illegal."],
  ["Repeated or serious breaches", "May lead to a member losing posting rights or being removed from the community."],
];

function Guidelines() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[220px_1fr] lg:px-8">
      <CommunitySidebar active="guidelines" />
      <div className="max-w-3xl">
        <CommunityMobileNav active="guidelines" />
        <h1 className="font-serif text-5xl text-primary">Community guidelines</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          The SOQ Community is where students, alumni, trainers and businesses learn from each other — ask questions, show your work, share what worked, and find opportunities. These rules keep it useful and safe for everyone.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="font-serif text-2xl text-primary">Who can join</h2>
          <p className="mt-2 text-foreground/80">Anyone can read posts without an account. To write posts, comment, like or save, you sign in and set up a community profile with a public username and one member label:</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            <li className="flex items-center gap-2 text-sm"><Users className="size-4 text-brand-gold" /> <strong>Member</strong> — anyone interested in learning</li>
            <li className="flex items-center gap-2 text-sm"><Users className="size-4 text-brand-gold" /> <strong>Student</strong> — currently enrolled at SOQ</li>
            <li className="flex items-center gap-2 text-sm"><Users className="size-4 text-brand-gold" /> <strong>Alumni</strong> — graduated from an SOQ course</li>
            <li className="flex items-center gap-2 text-sm"><Users className="size-4 text-brand-gold" /> <strong>Trainer</strong> — teaches or has taught at SOQ</li>
            <li className="flex items-center gap-2 text-sm"><Users className="size-4 text-brand-gold" /> <strong>Business</strong> — a salon, clinic or employer</li>
          </ul>
          <p className="mt-3 text-sm text-muted-foreground">Your email is never shown publicly. Only the username, display name and label you choose appear on your posts.</p>
        </div>

        <h2 className="mt-10 flex items-center gap-2 font-serif text-3xl text-primary"><PenSquare className="size-6 text-brand-gold" /> Rules for posts</h2>
        <ol className="mt-4 grid gap-4">
          {postRules.map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <span className="font-serif text-3xl text-brand-gold">{i + 1}</span>
              <div><h3 className="font-serif text-xl text-primary">{t}</h3><p className="mt-1 text-foreground/80">{d}</p></div>
            </li>
          ))}
        </ol>

        <h2 className="mt-10 flex items-center gap-2 font-serif text-3xl text-primary"><MessageSquare className="size-6 text-brand-gold" /> Rules for comments</h2>
        <ol className="mt-4 grid gap-4">
          {commentRules.map(([t, d], i) => (
            <li key={t} className="flex gap-4 rounded-lg border border-border bg-card p-5">
              <span className="font-serif text-3xl text-brand-gold">{i + 1}</span>
              <div><h3 className="font-serif text-xl text-primary">{t}</h3><p className="mt-1 text-foreground/80">{d}</p></div>
            </li>
          ))}
        </ol>

        <div className="mt-10 rounded-lg bg-brand-navy p-6 text-primary-foreground">
          <h2 className="flex items-center gap-2 font-serif text-3xl text-brand-gold"><BadgeCheck /> The Verified SOQ badge</h2>
          <p className="mt-2 text-primary-foreground/85">The badge tells other members that SOQ has checked this trainer or business. Here's how it works:</p>
          <ul className="mt-4 grid gap-3">
            {verifiedPoints.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm text-primary-foreground/90">
                <span className="font-serif text-xl text-brand-gold">{i + 1}</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-primary-foreground/70">
            To request verification, email <a href={`mailto:${contact.email}`} className="underline text-brand-gold">{contact.email}</a> with your community username and proof of your trainer or business status.
          </p>
        </div>

        <h2 className="mt-10 flex items-center gap-2 font-serif text-3xl text-primary"><ShieldCheck className="size-6 text-brand-gold" /> How moderation works</h2>
        <div className="mt-4 grid gap-4">
          {enforcement.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-border bg-card p-5">
              <h3 className="font-serif text-xl text-primary">{t}</h3>
              <p className="mt-1 text-foreground/80">{d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border-2 border-brand-gold bg-brand-gold-soft p-6">
          <h2 className="flex items-center gap-2 font-serif text-2xl text-primary"><Flag className="size-5 text-brand-gold" /> Report a post or comment</h2>
          <p className="mt-2 text-foreground/80">
            See something that breaks these rules? Email <a href={`mailto:${contact.email}`} className="underline">{contact.email}</a> with the link to the post or comment and a short note. You can also message SOQ on WhatsApp at <a href={contact.whatsapp} className="underline">{contact.phone}</a>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Reports are confidential. We don't tell the author who reported them.</p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          These guidelines may change. Changes take effect when posted on this page. By posting in the SOQ Community you agree to follow them. Questions? Start a thread in <Link to="/community" search={{ tag: "question" }} className="underline">Ask & Answer</Link> or contact us directly.
        </p>
      </div>
    </section>
  );
}
