import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Database, GraduationCap, Headphones, LayoutGrid, MapPin, PenTool, Sparkles, Star, TrendingUp, User, UsersRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/course-card";
import { categories, courses } from "@/lib/site-content";
import heroImage from "@/assets/soq-hero.jpg";
import diplomaImage from "@/assets/course-diploma.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "SOQ International Academy | Skills for What’s Next" },
    { name: "description", content: "Practical, industry-relevant training in AI, business, beauty, wellness and service for individuals and businesses in Singapore." },
    { property: "og:title", content: "SOQ International Academy | Skills for What’s Next" },
    { property: "og:description", content: "Build practical skills for your career or business with SOQ International Academy." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HomePage,
});

const trustPoints = [
  { icon: GraduationCap, title: "WSQ courses", copy: "available" },
  { icon: Database, title: "Funding support", copy: "for eligible learners" },
  { icon: MapPin, title: "Central location", copy: "Tanjong Pagar" },
  { icon: UsersRound, title: "Individuals", copy: "and businesses" },
];

/** Gold + navy diagonal swoosh used on the approved design's cards. */
function CornerSwoosh() {
  return (
    <svg aria-hidden viewBox="0 0 200 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] w-full">
      <path d="M0 18 C50 40 110 40 200 10 L200 60 L0 60 Z" className="fill-brand-gold-soft" />
      <path d="M0 42 C40 56 90 50 125 60 L0 60 Z" className="fill-brand-navy" />
    </svg>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [interest, setInterest] = useState("");
  const findCourses = () => navigate({ to: "/courses", search: interest ? { category: interest } : {} });
  return (
    <>
      {/* HERO */}
      <section className="relative isolate overflow-hidden bg-background">
        <img src={heroImage} alt="Adult learners in a bright Singapore classroom" width={1536} height={1024} className="absolute inset-y-0 right-0 h-full w-full object-cover object-[65%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-transparent lg:via-background/60" />
        {/* gold diagonal swoosh */}
        <svg aria-hidden viewBox="0 0 1000 700" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block">
          <path d="M560 0 C470 180 470 420 620 700 L660 700 C520 430 520 190 610 0 Z" className="fill-brand-gold/35" />
          <path d="M700 700 C820 610 930 600 1000 560 L1000 700 Z" className="fill-brand-gold-soft" />
        </svg>
        <p aria-hidden className="absolute right-8 top-10 hidden -rotate-6 text-right font-script text-4xl leading-tight text-brand-navy/80 xl:block">Real Skills<br />Real Opportunities<br />A Brighter You<span className="mt-1 block h-0.5 w-40 translate-x-10 rounded bg-brand-gold" /></p>

        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 lg:px-8 lg:pb-12 lg:pt-16">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/70">Skills today. A brighter tomorrow.</p>
            <h1 className="mt-4 font-serif text-6xl leading-[0.95] text-primary md:text-[5.5rem]">Build the skills<br />for what’s next.</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-foreground/75 md:text-lg">Practical, industry-relevant training in AI, business, beauty and wellness for working adults, professionals and businesses in Singapore.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-brand-gold px-7 text-brand-navy shadow-none hover:bg-brand-gold/85"><Link to="/courses">Explore Courses <ArrowRight /></Link></Button>
              <Button asChild size="lg" className="h-12 rounded-full px-7 shadow-none"><Link to="/recommend">Get Course Advice <ArrowRight /></Link></Button>
            </div>
          </div>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              {trustPoints.map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3"><Icon className="size-7 shrink-0 text-primary" strokeWidth={1.4} /><p className="text-xs leading-4 text-foreground/80">{title}<br />{copy}</p></div>)}
            </div>
            <Link to="/about" className="hidden w-72 overflow-hidden rounded-xl border-4 border-background bg-background shadow-xl md:flex">
              <img src={diplomaImage} alt="" width={160} height={120} className="h-28 w-32 object-cover" />
              <div className="flex flex-1 flex-col justify-between p-3">
                <div className="flex items-start justify-between gap-2"><p className="font-serif text-lg leading-tight text-primary">More Possibilities Ahead</p><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><ArrowRight className="size-3" /></span></div>
                <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">Singapore · A brighter tomorrow</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* STUDY PATHS */}
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex items-end justify-between gap-5"><div><p className="text-[11px] uppercase tracking-[0.35em] text-foreground/70">Explore your path</p><h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">What do you want to learn?</h2></div><Link to="/courses" className="hidden items-center gap-2 text-sm text-primary md:flex">View all courses <ArrowRight className="size-4" /></Link></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <Link key={category.name} to="/courses" search={{ category: category.name }} className="group relative isolate flex aspect-[4/3] flex-col overflow-hidden rounded-lg border border-border bg-brand-cream p-5 shadow-sm">
              <img src={category.image} alt="" loading="lazy" width={1024} height={768} className="absolute bottom-0 right-0 -z-10 h-[68%] w-[58%] rounded-tl-[3rem] object-cover transition-transform duration-500 group-hover:scale-105" />
              <CornerSwoosh />
              <h3 className="font-serif text-2xl leading-tight text-primary">{category.name === "Diplomas" ? "Diplomas & Professional Qualifications" : category.name}</h3>
              <p className="mt-2 max-w-[11rem] text-sm leading-5 text-foreground/75">{category.copy}</p>
              <span className="relative mt-auto grid size-10 place-items-center rounded-full bg-background text-primary shadow"><ArrowRight className="size-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* CREDIBILITY */}
      <section className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl border border-border bg-muted/40 px-8 py-6 shadow-sm">
          <div><span className="text-xs text-muted-foreground">Since</span><strong className="block font-serif text-4xl font-medium text-primary">2013</strong></div>
          <span className="hidden h-12 w-px bg-border md:block" />
          <div><span className="text-xs text-muted-foreground">Learners Trained</span><strong className="block font-serif text-4xl font-medium text-primary">10,000+</strong></div>
          <span className="hidden h-12 w-px bg-border md:block" />
          <div className="text-center"><strong className="block font-serif text-3xl font-medium text-primary">4.8 / 5</strong><span className="text-xs text-muted-foreground">Learner Rating</span><span className="mt-1 flex justify-center gap-0.5 text-brand-gold">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className="size-3.5 fill-current" />)}</span></div>
          <span className="hidden h-12 w-px bg-border md:block" />
          <div className="flex items-center gap-2"><span className="grid size-11 place-items-center rounded-full border-2 border-primary font-bold text-primary">WSQ</span><span className="text-[8px] font-semibold uppercase leading-3 text-primary">Singapore<br />Workforce Skills<br />Qualifications</span></div>
          <strong className="text-xl tracking-[0.2em] text-primary">VTCT</strong>
          <strong className="text-xl tracking-[0.2em] text-primary">ITEC</strong>
          <span className="hidden h-12 w-px bg-border md:block" />
          <span className="text-xs text-muted-foreground">Various industry<br />partners</span>
        </div>
      </section>

      {/* FINDER + FEATURED */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-[0.85fr_2.15fr] lg:px-8">
        <aside className="self-start rounded-xl border border-border bg-brand-cream p-6 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.35em] text-foreground/70">Find your course</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-primary">Not sure which course is right for you?</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Tell us what you’re looking to achieve and we’ll recommend suitable programmes.</p>
          <div className="mt-5 grid gap-3">
            <Select value={goal} onValueChange={setGoal}><div className="relative"><User className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" /><SelectTrigger className="h-12 bg-background pl-10"><SelectValue placeholder="I want to…" /></SelectTrigger></div><SelectContent><SelectItem value="upskill">Upskill for my role</SelectItem><SelectItem value="career">Change my career</SelectItem><SelectItem value="business">Train my team</SelectItem></SelectContent></Select>
            <Select value={interest} onValueChange={setInterest}><div className="relative"><LayoutGrid className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-primary" /><SelectTrigger className="h-12 bg-background pl-10"><SelectValue placeholder="I’m interested in…" /></SelectTrigger></div><SelectContent>{categories.map((c) => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select>
            <Button onClick={findCourses} className="h-12 rounded-full">Show my courses <ArrowRight /></Button>
            <Link to="/recommend" className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary"><Sparkles className="size-3.5 text-brand-gold" />Or describe your goals to our AI advisor</Link>
          </div>
          <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
            <span className="grid size-10 place-items-center rounded-full bg-brand-gold-soft text-primary"><Headphones className="size-5" /></span>
            <p className="text-xs text-muted-foreground"><strong className="block text-sm font-medium text-foreground">Prefer to chat?</strong>Speak with our course advisers.<a href="https://wa.me/6587182308" className="block font-semibold text-primary underline">Chat on WhatsApp →</a></p>
          </div>
        </aside>
        <div>
          <div className="flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-[0.35em] text-foreground/70">Popular ways to start</p><h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Featured Courses</h2></div><Link to="/courses" className="hidden items-center gap-2 text-sm text-primary md:flex">View all courses <ArrowRight className="size-4" /></Link></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{["ai-course-singapore", "certificate-in-eyebrow-embroidery", "effective-product-demonstration", "diploma-in-professional-make-up"].map((slug) => { const course = courses.find((c) => c.slug === slug); return course ? <CourseCard key={course.slug} course={course} showCompare={false} /> : null; })}</div>
        </div>
      </section>

      {/* CORPORATE */}
      <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <img src={heroImage} alt="" loading="lazy" width={1536} height={1024} className="absolute inset-y-0 right-0 -z-10 hidden h-full w-1/2 object-cover lg:block" />
        <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-primary via-primary to-transparent lg:block" style={{ backgroundSize: "100%" }} />
        <p aria-hidden className="absolute right-10 top-8 hidden text-right font-serif text-lg uppercase leading-snug tracking-[0.35em] text-primary-foreground/40 lg:block">People<br />Skills<br />Business<br />Growth</p>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-10 px-5 py-14 lg:px-8">
          <div className="max-w-md">
            <p className="text-[11px] uppercase tracking-[0.35em] text-primary-foreground/80">For businesses</p>
            <h2 className="mt-3 font-serif text-5xl">Build a stronger team.</h2>
            <p className="mt-3 text-sm text-primary-foreground/75">Customised training solutions in AI, business, retail, customer experience and workplace skills.</p>
            <Button asChild className="mt-6 h-11 rounded-full bg-brand-gold px-6 text-brand-navy hover:bg-brand-gold/85"><Link to="/businesses">Explore Corporate Training <ArrowRight /></Link></Button>
          </div>
          <div className="flex divide-x divide-primary-foreground/20 border-l border-primary-foreground/20">
            {[{ icon: PenTool, label: "Customised programmes" }, { icon: TrendingUp, label: "Skills for business growth" }, { icon: UsersRound, label: "Flexible training options" }].map(({ icon: Icon, label }) => <div key={label} className="flex w-28 flex-col items-center gap-3 px-3 text-center text-xs"><Icon className="size-7" strokeWidth={1.5} />{label}</div>)}
          </div>
          <Link to="/contact" className="ml-auto hidden items-center gap-3 self-end rounded-xl bg-background p-4 text-foreground shadow-xl lg:flex">
            <UsersRound className="size-8 text-brand-gold" />
            <span className="text-xs">Let’s discuss<br />your training needs.<span className="mt-1 flex items-center gap-1 font-semibold text-primary underline">Talk to our team <ArrowRight className="size-3" /></span></span>
          </Link>
        </div>
      </section>
    </>
  );
}
