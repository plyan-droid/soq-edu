import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Home, HelpCircle, Images, Briefcase, BookHeart, Cpu, Users, Bookmark, Sparkles, CalendarDays, Wallet, LayoutDashboard, ScrollText, FileText, ShieldCheck, ChevronDown, Radio } from "lucide-react";
import { memberTypes } from "@/lib/community";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { Button } from "@/components/ui/button";

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
  { to: "/events", label: "Events & workshops", Icon: CalendarDays },
  { to: "/funding", label: "Funding & SkillsFuture", Icon: Wallet },
  { to: "/student-portal", label: "Student portal", Icon: LayoutDashboard },
] as const;

const other = [
  { to: "/community/guidelines", label: "Community guidelines", Icon: ScrollText },
  { to: "/student-policies", label: "Student policies", Icon: FileText },
  { to: "/pei-profile", label: "PEI profile", Icon: ShieldCheck },
] as const;

const item = (active: boolean) =>
  `flex min-w-0 items-center gap-3 rounded-md px-3 py-2 text-sm ${active ? "bg-brand-gold-soft font-medium text-primary" : "text-foreground/80 hover:bg-brand-gold-soft hover:text-primary"}`;

type Props = { active: string; who?: string | undefined };

export function CommunitySidebar({ active, who }: Props) {
  const [open, setOpen] = useState(true);
  const myCourses = useMyCourses();
  return (
    <aside className="hidden min-w-0 content-start gap-6 lg:grid">
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
      {myCourses.length > 0 && <nav className="grid min-w-0 gap-0.5"><p className="eyebrow mb-1 px-3">My Courses</p>{myCourses.map(slug => { const title = courses.find(c => c.slug === slug)?.title ?? slug; return <Link key={slug} to="/community/course/$slug" params={{ slug }} className={`${item(active === `course:${slug}`)} items-start leading-snug`}><BookHeart className="mt-0.5 size-4 shrink-0 text-brand-gold" /><span className="min-w-0 break-words">{title}</span></Link>; })}</nav>}
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
  const myCourses = useMyCourses();
  const [coursesOpen, setCoursesOpen] = useState(false);
  const currentCourse = myCourses.find(slug => active === `course:${slug}`);
  const chip = (a: boolean) => `shrink-0 rounded-full border px-4 py-1.5 text-sm ${a ? "border-brand-navy bg-brand-navy text-primary-foreground" : "border-border text-foreground/80"}`;
  return (
    <div className="mb-5 lg:hidden">
      {myCourses.length > 0 && <div className="mb-3">
        <Button type="button" variant="outline" aria-expanded={coursesOpen} aria-controls="community-mobile-courses" onClick={() => setCoursesOpen(open => !open)} className="flex h-auto min-h-10 w-full min-w-0 justify-between gap-3 rounded-md px-3 py-2 text-left">
          <span className="flex min-w-0 items-center gap-2"><BookHeart className="size-4 shrink-0 text-brand-gold" /><span className="min-w-0 truncate">{currentCourse ? courses.find(c => c.slug === currentCourse)?.title ?? currentCourse : "My Courses"}</span></span>
          <ChevronDown className={`size-4 shrink-0 transition-transform ${coursesOpen ? "rotate-180" : ""}`} />
        </Button>
        {coursesOpen && <nav id="community-mobile-courses" aria-label="My Courses" className="mt-1 grid gap-0.5 border-l border-border pl-2">{myCourses.map(slug => <Link key={slug} to="/community/course/$slug" params={{ slug }} onClick={() => setCoursesOpen(false)} aria-current={active === `course:${slug}` ? "page" : undefined} className={`${item(active === `course:${slug}`)} leading-snug`}><span className="min-w-0 break-words">{courses.find(c => c.slug === slug)?.title ?? slug}</span></Link>)}</nav>}
      </div>}
      <nav aria-label="Community sections" className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <Link to="/community" className={chip(active === "home")}>Home</Link>
        {sections.map(s => <Link key={s.tag} to="/community" search={{ tag: s.tag }} className={chip(active === s.tag)}>{s.label}</Link>)}
        <Link to="/community/live" className={chip(active === "live")}>Livestreams</Link>
        <Link to="/events" className={chip(false)}>Events</Link>
        <Link to="/community/members" className={chip(active === "members")}>Members</Link>
        <Link to="/community/saved" className={chip(active === "saved")}>Saved</Link>
        <Link to="/community/guidelines" className={chip(active === "guidelines")}>Guidelines</Link>
      </nav>
    </div>
  );
}

function useMyCourses() {
  const { user } = useAuth();
  const { data = [] } = useQuery({ enabled: !!user, queryKey: ["community-my-courses", user?.id], queryFn: async () => {
    const [enrolled, teaching] = await Promise.all([
      supabase.from("enrollments").select("course_slug").eq("student_id", user?.id ?? ""),
      supabase.from("trainer_courses").select("course_slug").eq("trainer_id", user?.id ?? ""),
    ]);
    return [...new Set([...(enrolled.data ?? []), ...(teaching.data ?? [])].map(row => row.course_slug))];
  } });
  return data;
}
