import { useEffect, useState } from "react";
import { FeeBreakdown } from "@/components/fee-breakdown";
import { lazy as lazyLoad, Suspense as LazySuspense } from "react";
import { ClientOnly as ChatClientOnly } from "@tanstack/react-router";
const LazyCourseChat = lazyLoad(() => import("@/components/course-chat").then((m) => ({ default: m.CourseChat })));
function CourseChat(props: { slug: string; title: string; onClose: () => void }) {
  return <ChatClientOnly fallback={null}><LazySuspense fallback={null}><LazyCourseChat {...props} /></LazySuspense></ChatClientOnly>;
}
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AddToCart } from "@/components/add-to-cart";
import { Award, BookOpen, Calendar, Check, ChevronDown, ChevronRight, Clock3, HelpCircle, Globe, GraduationCap, MapPin, MessageCircle, Share2, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/course-card";
import { courses, contact } from "@/lib/site-content";
import { courseOverridesQuery, mergeCourse, sectionsFor, customToCourse } from "@/lib/course-overrides";
import { CourseApplyForm } from "@/components/course-apply-form";
import { CourseReviews } from "@/components/course-reviews";
import { CourseQA, GiftCourse } from "@/components/student-extras";
import { NotifyMe, JoinWaitlist } from "@/components/learner-tools";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params, context }) => {
    const overrides = await context.queryClient.ensureQueryData(courseOverridesQuery).catch(() => []);
    const o = overrides.find((x) => x.slug === params.slug);
    const base = courses.find((c) => c.slug === params.slug) ?? (o?.custom ? customToCourse(o) : undefined);
    if (!base || o?.hidden) throw notFound();
    return { ...mergeCourse(base, o), sections: sectionsFor(base.slug, o), level: o?.level ?? null, requirements: o?.requirements ?? null, faqs: o?.faqs ?? [] };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | SOQ International Academy` },
          { name: "description", content: loaderData.summary },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.summary },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Course unavailable | SOQ International Academy" }, { name: "robots", content: "noindex" }],
  }),
  component: CoursePage,
});

const tabs = [
  { id: "about", label: "About" },
  { id: "outcomes", label: "Outcomes" },
  { id: "syllabus", label: "Syllabus" },
  { id: "reviews", label: "Reviews" },
  { id: "questions", label: "Q&A" },
  { id: "apply", label: "Apply" },
];

function levelFor(badge: string) {
  if (badge === "Diploma") return "Intermediate level";
  if (badge === "Workshop") return "Beginner level";
  return "Beginner friendly";
}

function ModuleCard({ index, title, items, image, duration, skills, defaultOpen }: { index: number; title: string; items: string[]; image: string; duration: string; skills: string[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <img src={image} alt="" className="h-14 w-24 shrink-0 rounded object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-primary underline-offset-4 hover:underline">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">Section {index + 1} · {items.length} topic{items.length === 1 ? "" : "s"}{index === 0 ? ` · ${duration}` : ""}</p>
        </div>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex shrink-0 items-center gap-1 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-primary underline underline-offset-4">
          <span className="hidden sm:inline">Section details</span><ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="mt-5">
          <p className="font-semibold text-primary">What you'll learn</p>
          <ul className="mt-3 space-y-2">{items.map((it, i) => <li key={i} className="flex gap-3 text-sm leading-6"><Check className="mt-1 size-4 shrink-0 text-primary" />{it}</li>)}</ul>
          {index === 0 && (<>
            <p className="mt-6 font-semibold text-primary">Skills you'll gain</p>
            <div className="mt-3 flex flex-wrap gap-2">{skills.map((s) => <span key={s} className="rounded-md bg-muted px-2.5 py-1 text-xs">{s}</span>)}</div>
          </>)}
        </div>
      )}
    </div>
  );
}

function FaqBlock({ badge, custom, onAsk }: { badge: string; custom: { q: string; a: string }[]; onAsk: () => void }) {
  const [all, setAll] = useState(false);
  const faqs: [string, string][] = custom.length ? custom.map(x => [x.q, x.a] as [string, string]) : [
    ["Can I use SkillsFuture Credit?", "Many SOQ courses are eligible for SkillsFuture Credit and WSQ funding of up to 70%. Our advisers will confirm your eligibility."],
    ["When is the next intake?", "See the Course Calendar or message us on WhatsApp for the latest schedule."],
    ["What certificate will I receive?", `You'll receive a ${badge} certificate on completion, subject to at least 75% attendance and passing the assessment.`],
    ["Do I need prior experience?", "Most courses are beginner friendly. Entry requirements, if any, are listed in the syllabus above."],
    ["Where are classes held?", "Classroom sessions are at 10 Anson Road, International Plaza, Singapore 079903."],
    ["Can my company sponsor me?", "Yes. Employers may claim Absentee Payroll and use SFEC credits. See our Businesses page or ask an adviser."],
  ];
  const shown = all ? faqs : faqs.slice(0, 3);
  return (
    <section>
      <h2 className="text-2xl font-semibold text-primary">Frequently asked questions</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-border bg-card px-6 py-2">
          <Accordion type="single" collapsible>
            {shown.map(([q, a]) => (
              <AccordionItem key={q} value={q}><AccordionTrigger className="text-left font-semibold text-primary">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
            ))}
          </Accordion>
          <button onClick={() => setAll((v) => !v)} className="mx-auto flex items-center gap-1 py-4 text-sm font-semibold text-primary">
            {all ? "Show fewer questions" : `Show all ${faqs.length} frequently asked questions`}<ChevronDown className={`size-4 ${all ? "rotate-180" : ""}`} />
          </button>
        </div>
        <div className="self-start rounded-lg border border-border bg-card p-6">
          <HelpCircle className="size-5 text-primary" />
          <p className="mt-2 text-lg font-semibold text-primary">More questions</p>
          <button onClick={onAsk} className="mt-2 block text-sm font-semibold text-primary hover:underline">Ask the SOQ Course Adviser</button>
          <Link to="/faq" className="mt-1 block text-sm font-semibold text-primary hover:underline">Visit the help centre</Link>
          <hr className="my-4 border-border" />
          <p className="text-xs text-muted-foreground">Funding available, <Link to="/funding" className="text-primary underline">learn more</Link></p>
        </div>
      </div>
    </section>
  );
}

function CoursePage() {
  const course = Route.useLoaderData();
  const [chatOpen, setChatOpen] = useState(false);
  useEffect(() => { if (window.matchMedia("(min-width: 1280px)").matches) setChatOpen(true); }, []);
  const related = courses.filter((c) => c.category === course.category && c.slug !== course.slug).slice(0, 3);
  const wa = `${contact.whatsapp}?text=${encodeURIComponent(`Hi SOQ, I'd like to enquire about the "${course.title}" course (${course.duration}, ${course.mode}). Could you share the upcoming schedule and fees?`)}`;
  const learn = course.sections.find((s) => /outcome|learn/i.test(s.title))?.items ?? course.outcomes;
  const modules = course.sections.filter((s) => !/outcome|learn/i.test(s.title));
  const skills = Array.from(new Set([course.category, course.badge, course.mode, ...modules.slice(0, 1).flatMap((m) => m.items.slice(0, 4).map((i) => (i.split(/[:,–-]/)[0] ?? "").trim()).filter((t) => t.length < 40))]));

  return (
    <div className={`xl:flex ${course.badge === "WSQ" ? "theme-wsq" : "theme-academic"}`}>
    <div className="min-w-0 flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-secondary">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-24 pt-8 lg:grid-cols-[1.3fr_0.7fr] lg:px-8">
          <div>
            <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="size-3.5" />
              <Link to="/courses" className="hover:text-primary">Courses</Link><ChevronRight className="size-3.5" />
              <span className="text-primary">{course.category}</span>
            </nav>
            <div className="mt-8 flex items-center gap-3">
              <img src="/favicon.png" alt="" className="size-9 rounded-full bg-card p-1" />
              <span className="text-sm font-semibold text-primary">SOQ International Academy</span>
              <span className="rounded-full bg-brand-gold-soft px-3 py-1 text-xs font-semibold text-primary">{course.badge}</span>
            </div>
            <h1 className="mt-5 max-w-3xl font-serif text-4xl leading-tight text-primary md:text-6xl">{course.title}</h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{course.summary}</p>
            <p className="mt-4 text-sm"><span className="text-muted-foreground">Taught by: </span><Link to="/trainers" className="font-semibold text-primary underline underline-offset-4">SOQ certified trainers</Link></p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button asChild className="h-14 rounded-md bg-primary px-8 text-base text-primary-foreground hover:bg-primary/90">
                <a href="#apply"><span className="flex flex-col items-start leading-tight"><span>Apply now</span><span className="text-xs font-normal opacity-80">{course.price}</span></span></a>
              </Button>
              <Button asChild variant="outline" className="h-14 rounded-md px-6"><a href={wa}><MessageCircle /> Ask on WhatsApp</a></Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">SkillsFuture Credit and WSQ funding may apply · <Link to="/funding" className="text-primary underline underline-offset-4">Check eligibility</Link></p>
          </div>
          <div className="hidden lg:block">
            <img src={course.image} alt={course.title} width={1024} height={768} className="aspect-[4/3] w-full rounded-lg object-cover shadow-lg" />
          </div>
        </div>
      </section>

      {/* Stat bar */}
      <div className="relative z-10 mx-auto -mt-14 max-w-7xl px-5 lg:px-8">
        <div className="grid divide-y divide-border rounded-lg border border-border bg-card shadow-lg sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
          {[
            { t: course.badge === "Diploma" ? "Diploma programme" : `${course.badge} certified`, s: "Recognised qualification", i: Award },
            { t: "Rated by learners", s: "See reviews below", i: Star },
            { t: course.level || levelFor(course.badge), s: course.requirements ? "See entry requirements" : "No prior experience needed", i: GraduationCap },
            { t: course.duration, s: "Total course length", i: Clock3 },
            { t: course.mode, s: "Flexible intakes", i: Calendar },
          ].map(({ t, s, i: Icon }) => (
            <div key={t} className="flex items-start gap-3 p-5">
              <Icon className="mt-0.5 size-5 shrink-0 text-brand-gold" />
              <div><p className="font-semibold leading-snug text-primary">{t}</p><p className="mt-1 text-xs text-muted-foreground">{s}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 mt-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-5 lg:px-8">
          {tabs.map((t) => (
            <a key={t.id} href={`#${t.id}`} className="whitespace-nowrap border-b-2 border-transparent py-4 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary">{t.label}</a>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 lg:grid-cols-[1fr_320px] lg:px-8">
        <div className="min-w-0 space-y-14">
          <section id="about" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-primary">What you'll learn</h2>
            <div className="mt-5 grid gap-4 rounded-lg border border-border p-6 md:grid-cols-2">
              {learn.slice(0, 8).map((item) => (
                <p key={item} className="flex items-start gap-3 text-sm leading-6"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{item}</p>
              ))}
            </div>
          </section>

          {course.requirements && <section>
            <h2 className="text-xl font-semibold text-primary">Who it's for / entry requirements</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{course.requirements}</p>
          </section>}

          <section>
            <h2 className="text-xl font-semibold text-primary">Skills you'll gain</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => <span key={s} className="rounded-full bg-muted px-4 py-1.5 text-sm text-foreground">{s}</span>)}
            </div>
          </section>

          <section id="outcomes" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-primary">Details to know</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-3">
              {[
                { i: Share2, t: "Shareable certificate", s: "Add to your LinkedIn profile" },
                { i: Globe, t: "Taught in English", s: "Clear, practical instruction" },
                { i: MapPin, t: course.mode, s: "10 Anson Road, Singapore" },
              ].map(({ i: Icon, t, s }) => (
                <div key={t}><Icon className="size-6 text-brand-gold" /><p className="mt-2 font-semibold text-primary">{t}</p><p className="text-sm text-muted-foreground">{s}</p></div>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-6 rounded-lg bg-secondary p-6 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-primary">Advance your career with a recognised credential</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex gap-2"><Check className="size-4 text-brand-gold" />Earn a certificate from SOQ International Academy</li>
                  <li className="flex gap-2"><Check className="size-4 text-brand-gold" />Hands-on practice with industry trainers</li>
                  <li className="flex gap-2"><Check className="size-4 text-brand-gold" />Career support and job matching after you finish</li>
                </ul>
              </div>
              <Award className="size-20 shrink-0 text-brand-gold" />
            </div>
          </section>

          <section id="syllabus" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold text-primary">Course syllabus</h2>
            <p className="mt-2 text-sm text-muted-foreground">{modules.length || 1} section{modules.length === 1 ? "" : "s"} · {course.duration}</p>
            <div className="mt-5 space-y-4">
              {(modules.length ? modules : [{ title: "Course content", items: course.outcomes }]).map((m, idx) => (
                <ModuleCard key={m.title} index={idx} title={m.title} items={m.items} image={course.image} duration={course.duration} skills={skills} defaultOpen={idx === 0} />
              ))}
            </div>
          </section>

          <section id="reviews" className="scroll-mt-20"><CourseReviews slug={course.slug} /></section>

          <section id="questions" className="scroll-mt-20"><CourseQA slug={course.slug} /></section>

          <section id="apply" className="scroll-mt-20"><CourseApplyForm slug={course.slug} title={course.title} /></section>

          <FaqBlock badge={course.badge} custom={course.faqs} onAsk={() => setChatOpen(true)} />
        </div>

        <aside className="self-start space-y-4 lg:sticky lg:top-20">
          <FeeBreakdown price={course.price} badge={course.badge} />
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2"><Clock3 className="size-4 text-brand-gold" />{course.duration}</li>
            <li className="flex gap-2"><MapPin className="size-4 text-brand-gold" />{course.mode}</li>
            <li className="flex gap-2"><Users className="size-4 text-brand-gold" />Small classes</li>
          </ul>
          <Button asChild className="mt-6 h-12 w-full rounded-md"><a href="#apply">Apply now</a></Button>
          <Button asChild variant="outline" className="mt-3 h-12 w-full rounded-md"><a href={wa}>Enquire on WhatsApp</a></Button>
          <AddToCart slug={course.slug} title={course.title} price={course.price} />
          <GiftCourse slug={course.slug} title={course.title} />
          <NotifyMe slug={course.slug} />
          <JoinWaitlist slug={course.slug} />
          <Link to="/compare" className="mt-3 block text-center text-sm text-primary underline underline-offset-4">Compare with other courses</Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="bg-muted/50">
          <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
            <h2 className="text-2xl font-semibold text-primary">Learners also viewed</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((c) => <CourseCard key={c.slug} course={c} />)}</div>
          </div>
        </section>
      )}
    </div>
    {chatOpen && (
      <>
        <aside className="sticky top-0 hidden h-screen w-[380px] shrink-0 border-l border-border xl:block">
          <CourseChat slug={course.slug} title={course.title} onClose={() => setChatOpen(false)} />
        </aside>
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 xl:hidden" onClick={() => setChatOpen(false)}>
          <div className="h-full w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <CourseChat slug={course.slug} title={course.title} onClose={() => setChatOpen(false)} />
          </div>
        </div>
      </>
    )}
    {!chatOpen && (
      <button onClick={() => setChatOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg">
        <MessageCircle className="size-4" /> Is this right for me?
      </button>
    )}
    </div>
  );
}
