import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AddToCart } from "@/components/add-to-cart";
import { Award, BookOpen, Calendar, Check, ChevronRight, Clock3, Globe, GraduationCap, MapPin, MessageCircle, Share2, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/course-card";
import { courses, contact } from "@/lib/site-content";
import { courseOverridesQuery, mergeCourse, sectionsFor } from "@/lib/course-overrides";
import { CourseApplyForm } from "@/components/course-apply-form";
import { CourseReviews } from "@/components/course-reviews";

export const Route = createFileRoute("/courses/$slug")({
  loader: async ({ params, context }) => {
    const base = courses.find((c) => c.slug === params.slug);
    if (!base) throw notFound();
    const overrides = await context.queryClient.ensureQueryData(courseOverridesQuery).catch(() => []);
    const o = overrides.find((x) => x.slug === base.slug);
    return { ...mergeCourse(base, o), sections: sectionsFor(base.slug, o) };
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
  { id: "apply", label: "Apply" },
];

function levelFor(badge: string) {
  if (badge === "Diploma") return "Intermediate level";
  if (badge === "Workshop") return "Beginner level";
  return "Beginner friendly";
}

function CoursePage() {
  const course = Route.useLoaderData();
  const related = courses.filter((c) => c.category === course.category && c.slug !== course.slug).slice(0, 3);
  const wa = `${contact.whatsapp}?text=${encodeURIComponent(`Hi SOQ, I'd like to enquire about the "${course.title}" course (${course.duration}, ${course.mode}). Could you share the upcoming schedule and fees?`)}`;
  const learn = course.sections.find((s) => /outcome|learn/i.test(s.title))?.items ?? course.outcomes;
  const modules = course.sections.filter((s) => !/outcome|learn/i.test(s.title));
  const skills = Array.from(new Set([course.category, course.badge, course.mode, ...modules.slice(0, 1).flatMap((m) => m.items.slice(0, 4).map((i) => i.split(/[:,–-]/)[0].trim()).filter((t) => t.length < 40))]));

  return (
    <>
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
            { t: levelFor(course.badge), s: "No prior experience needed", i: GraduationCap },
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
            {modules.length === 0 ? (
              <div className="mt-5 rounded-lg border border-border p-6"><ul className="space-y-3">{course.outcomes.map((o) => <li key={o} className="flex gap-3 text-sm leading-6"><BookOpen className="mt-0.5 size-4 shrink-0 text-brand-gold" />{o}</li>)}</ul></div>
            ) : (
              <Accordion type="multiple" defaultValue={["m0"]} className="mt-5 rounded-lg border border-border">
                {modules.map((m, idx) => (
                  <AccordionItem key={m.title} value={`m${idx}`} className="px-6 last:border-b-0">
                    <AccordionTrigger className="py-5 hover:no-underline">
                      <div className="text-left"><p className="text-lg font-semibold text-primary">{m.title}</p><p className="mt-1 text-xs font-normal text-muted-foreground">Section {idx + 1} · {m.items.length} topic{m.items.length === 1 ? "" : "s"}</p></div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-3 pb-2">{m.items.map((it, i) => <li key={i} className="flex gap-3 text-sm leading-6"><Check className="mt-0.5 size-4 shrink-0 text-brand-gold" />{it}</li>)}</ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </section>

          <section id="reviews" className="scroll-mt-20"><CourseReviews slug={course.slug} /></section>

          <section id="apply" className="scroll-mt-20"><CourseApplyForm slug={course.slug} title={course.title} /></section>

          <section>
            <h2 className="text-2xl font-semibold text-primary">Frequently asked questions</h2>
            <Accordion type="single" collapsible className="mt-5 border-t border-border">
              {[
                ["Can I use SkillsFuture Credit?", "Many SOQ courses are eligible for SkillsFuture Credit and WSQ funding of up to 70%. Our advisers will confirm your eligibility."],
                ["When is the next intake?", "See the Course Calendar or message us on WhatsApp for the latest schedule."],
                ["What certificate will I receive?", `You'll receive a ${course.badge} certificate on completion, subject to at least 75% attendance and passing the assessment.`],
                ["Do I need prior experience?", "Most courses are beginner friendly. Entry requirements, if any, are listed in the syllabus above."],
              ].map(([q, a]) => (
                <AccordionItem key={q} value={q}><AccordionTrigger className="text-left font-semibold text-primary">{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>
              ))}
            </Accordion>
          </section>
        </div>

        <aside className="self-start rounded-lg border border-border bg-card p-6 shadow-sm lg:sticky lg:top-20">
          <p className="text-sm text-muted-foreground">Course fee</p>
          <p className="mt-1 font-serif text-3xl text-primary">{course.price}</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex gap-2"><Clock3 className="size-4 text-brand-gold" />{course.duration}</li>
            <li className="flex gap-2"><MapPin className="size-4 text-brand-gold" />{course.mode}</li>
            <li className="flex gap-2"><Users className="size-4 text-brand-gold" />Small classes</li>
          </ul>
          <Button asChild className="mt-6 h-12 w-full rounded-md"><a href="#apply">Apply now</a></Button>
          <Button asChild variant="outline" className="mt-3 h-12 w-full rounded-md"><a href={wa}>Enquire on WhatsApp</a></Button>
          <AddToCart slug={course.slug} title={course.title} price={course.price} />
          <Link to="/compare" className="mt-3 block text-center text-sm text-primary underline underline-offset-4">Compare with other courses</Link>
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
    </>
  );
}
