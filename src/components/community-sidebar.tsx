import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home, HelpCircle, Images, Briefcase, BookHeart, Cpu, Users, Bookmark, Sparkles, CalendarDays, Wallet, LayoutDashboard, ScrollText, FileText, ShieldCheck, ChevronDown, Radio } from "lucide-react";
import { memberTypes } from "@/lib/community";

export const sections = [
  { tag: "question", label: "Ask & Answer", Icon: HelpCircle },
  { tag: "showcase", label: "Showcase", Icon: Images },
  { tag: "jobs", label: "Jobs & Gigs", Icon: Briefcase },
  { tag: "story", label: "Stories", Icon: BookHeart },
  { tag: "tech", label: "Tech & AI", Icon: Cpu },
] as const;

const learn = [
  { to: "/recommend", label: "Find my course", Icon: Sparkles },
  { to: "/calendar", label: "Course calendar", Icon: CalendarDays },
  { to: "/funding", label: "Funding & SkillsFuture", Icon: Wallet },
  { to: "/student-portal", label: "Student portal", Icon: LayoutDashboard },
] as const;

const other = [
  { to: "/community/guidelines", label: "Community guidelines", Icon: ScrollText },
  { to: "/student-policies", label: "Student policies", Icon: FileText },
  { to: "/pei-profile", label: "PEI profile", Icon: ShieldCheck },
] as const;

const item = (active: boolean) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? "bg-brand-gold-soft font-medium text-primary" : "text-foreground/80 hover:bg-brand-gold-soft hover:text-primary"}`;

type Props = { active: string; who?: string | undefined };

export function CommunitySidebar({ active, who }: Props) {
  const [open, setOpen] = useState(true);
  return (
    <aside className="hidden content-start gap-6 lg:grid">
      <nav className="grid gap-0.5">
        <p className="eyebrow mb-1 px-3">Community</p>
        <Link to="/community" className={item(active === "home")}><Home className="size-4 text-brand-gold" />Home</Link>
        {sections.map(({ tag, label, Icon }) => (
          <Link key={tag} to="/community" search={{ tag }} className={item(active === tag)}><Icon className="size-4 text-brand-gold" />{label}</Link>
        ))}
        <Link to="/community/live" className={item(active === "live")}><Radio className="size-4 text-brand-gold" />Livestreams</Link>
        <Link to="/community/members" className={item(active === "members")}><Users className="size-4 text-brand-gold" />Members</Link>
        <Link to="/community/saved" className={item(active === "saved")}><Bookmark className="size-4 text-brand-gold" />Saved posts</Link>
      </nav>
      <div>
        <button type="button" onClick={() => setOpen(o => !o)} className="eyebrow mb-1 flex w-full items-center justify-between px-3">
          Learn with SOQ <ChevronDown className={`size-4 transition ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && <nav className="grid gap-0.5">{learn.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className={item(false)}><Icon className="size-4 text-muted-foreground" />{label}</Link>
        ))}</nav>}
      </div>
      {(active === "home" || sections.some(s => s.tag === active)) && (
        <div>
          <p className="eyebrow mb-1 px-3">Posts from</p>
          <div className="grid gap-0.5">
            <Link to="/community" search={(p: Record<string, unknown>) => ({ ...p, who: undefined })} className={item(!who)}>Everyone</Link>
            {Object.entries(memberTypes).filter(([k]) => k !== "member").map(([k, v]) => (
              <Link key={k} to="/community" search={(p: Record<string, unknown>) => ({ ...p, who: k })} className={item(who === k)}>{v === "Alumni" ? v : v === "Business" ? "Businesses" : `${v}s`}</Link>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="eyebrow mb-1 px-3">Other</p>
        <nav className="grid gap-0.5">{other.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className={item(active === "guidelines" && to === "/community/guidelines")}><Icon className="size-4 text-muted-foreground" />{label}</Link>
        ))}</nav>
      </div>
    </aside>
  );
}

export function CommunityMobileNav({ active }: { active: string }) {
  const chip = (a: boolean) => `shrink-0 rounded-full border px-4 py-1.5 text-sm ${a ? "border-brand-navy bg-brand-navy text-primary-foreground" : "border-border text-foreground/80"}`;
  return (
    <nav className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:hidden">
      <Link to="/community" className={chip(active === "home")}>Home</Link>
      {sections.map(s => <Link key={s.tag} to="/community" search={{ tag: s.tag }} className={chip(active === s.tag)}>{s.label}</Link>)}
      <Link to="/community/live" className={chip(active === "live")}>Livestreams</Link>
      <Link to="/community/members" className={chip(active === "members")}>Members</Link>
      <Link to="/community/saved" className={chip(active === "saved")}>Saved</Link>
      <Link to="/community/guidelines" className={chip(active === "guidelines")}>Guidelines</Link>
    </nav>
  );
}
