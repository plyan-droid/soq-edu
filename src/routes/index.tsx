import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Database, GraduationCap, MapPin, Star, UsersRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CourseCard } from "@/components/course-card";
import { categories, courses } from "@/lib/site-content";
import heroImage from "@/assets/soq-hero.jpg";

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

function HomePage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState("");
  const [interest, setInterest] = useState("");
  const findCourses = () => navigate({ to: "/courses", search: interest ? { category: interest } : {} });
  return (
    <>
      <section className="relative isolate min-h-[650px] overflow-hidden bg-brand-cream lg:min-h-[680px]">
        <img src={heroImage} alt="Adult learners in a bright Singapore classroom" width={1536} height={1024} className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/5" />
        <div className="relative mx-auto flex min-h-[650px] max-w-7xl items-center px-5 py-20 lg:min-h-[680px] lg:px-8">
          <div className="max-w-xl">
            <p className="eyebrow">Skills today. A brighter tomorrow.</p>
            <h1 className="mt-5 font-serif text-6xl leading-[0.93] text-primary md:text-8xl">Build the skills<br />for what’s next.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-foreground/75 md:text-lg">Practical, industry-relevant training in AI, business, beauty and wellness for working adults, professionals and businesses in Singapore.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-brand-gold px-6 text-brand-navy shadow-none hover:bg-brand-gold/85"><Link to="/courses">Explore Courses <ArrowRight /></Link></Button>
              <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-none"><Link to="/contact">Get Course Advice <ArrowRight /></Link></Button>
            </div>
          </div>
        </div>
        <div className="relative border-t border-border/70 bg-background/95">
          <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 lg:grid-cols-4 lg:px-8">{trustPoints.map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3 border-border px-2 py-5 lg:border-r lg:px-6 first:pl-0 last:border-r-0"><Icon className="size-6 text-primary" /><p className="text-xs"><strong className="block text-foreground">{title}</strong><span className="text-muted-foreground">{copy}</span></p></div>)}</div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="flex items-end justify-between gap-5"><div><p className="eyebrow">Explore your path</p><h2 className="mt-3 font-serif text-4xl text-primary md:text-6xl">What do you want to learn?</h2></div><Link to="/courses" className="hidden items-center gap-2 text-sm font-semibold text-primary md:flex">View all courses <ArrowRight className="size-4" /></Link></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <Link key={category.name} to="/courses" search={{ category: category.name }} className="group relative isolate aspect-[4/3] overflow-hidden rounded-lg bg-muted"><img src={category.image} alt="" loading="lazy" width={1024} height={768} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/55 to-primary/70" /><div className="relative flex h-full flex-col p-5"><h3 className="font-serif text-2xl text-primary">{category.name}</h3><p className="mt-1 max-w-[15rem] text-sm text-foreground/70">{category.copy}</p><span className="mt-auto grid size-10 place-items-center rounded-full bg-background text-primary"><ArrowRight className="size-4" /></span></div></Link>)}</div>
      </section>

      <section className="border-y border-border bg-muted/50"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-5 py-8 text-center md:grid-cols-4 lg:px-8"><div><span className="text-xs text-muted-foreground">Since</span><strong className="block font-serif text-3xl text-primary">2013</strong></div><div><span className="text-xs text-muted-foreground">Learners trained</span><strong className="block font-serif text-3xl text-primary">10,000+</strong></div><div><span className="text-xs text-muted-foreground">Learner rating</span><strong className="block font-serif text-3xl text-primary">4.8 / 5</strong><span className="mt-1 flex justify-center gap-0.5 text-brand-gold">{[1,2,3,4,5].map(n => <Star key={n} className="size-3 fill-current" />)}</span></div><div><span className="text-xs text-muted-foreground">Industry recognised</span><strong className="block font-serif text-3xl text-primary">WSQ · VTCT · ITEC</strong></div></div></section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_2.2fr] lg:px-8">
        <aside className="self-start rounded-lg bg-brand-cream p-7"><p className="eyebrow">Find your course</p><h2 className="mt-3 font-serif text-3xl leading-tight text-primary">Not sure which course is right for you?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Tell us what you’re looking to achieve and we’ll recommend suitable programmes.</p><div className="mt-6 grid gap-3"><Select value={goal} onValueChange={setGoal}><SelectTrigger className="h-12 bg-background"><SelectValue placeholder="I want to…" /></SelectTrigger><SelectContent><SelectItem value="upskill">Upskill for my role</SelectItem><SelectItem value="career">Change my career</SelectItem><SelectItem value="business">Train my team</SelectItem></SelectContent></Select><Select value={interest} onValueChange={setInterest}><SelectTrigger className="h-12 bg-background"><SelectValue placeholder="I’m interested in…" /></SelectTrigger><SelectContent>{categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select><Button onClick={findCourses} className="h-12 rounded-full">Show my courses <ArrowRight /></Button></div><a href="https://wa.me/6562221234" className="mt-6 block border-t border-border pt-5 text-sm font-semibold text-primary">Prefer to chat? Message us on WhatsApp →</a></aside>
        <div><div className="flex items-end justify-between"><div><p className="eyebrow">Popular ways to start</p><h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">Featured Courses</h2></div><Link to="/courses" className="hidden items-center gap-2 text-sm font-semibold md:flex">View all courses <ArrowRight className="size-4" /></Link></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{courses.slice(0,4).map(course => <CourseCard key={course.slug} course={course} />)}</div></div>
      </section>

      <section className="overflow-hidden bg-primary text-primary-foreground"><div className="mx-auto grid max-w-7xl lg:grid-cols-[1.2fr_0.8fr]"><div className="px-5 py-16 lg:px-8 lg:py-20"><p className="eyebrow">For businesses</p><h2 className="mt-3 font-serif text-5xl">Build a stronger team.</h2><p className="mt-4 max-w-xl text-primary-foreground/65">Customised training solutions in AI, business, retail, customer experience and workplace skills.</p><div className="mt-8 grid max-w-2xl gap-4 sm:grid-cols-3"><p className="flex items-center gap-2 text-sm"><Building2 className="text-brand-gold" />Customised programmes</p><p className="flex items-center gap-2 text-sm"><Star className="text-brand-gold" />Skills for growth</p><p className="flex items-center gap-2 text-sm"><UsersRound className="text-brand-gold" />Flexible options</p></div><Button asChild className="mt-8 rounded-full bg-brand-gold text-brand-navy hover:bg-brand-gold/85"><Link to="/businesses">Explore Corporate Training <ArrowRight /></Link></Button></div><img src={heroImage} alt="Professional training session" loading="lazy" width={1536} height={1024} className="h-full min-h-72 w-full object-cover object-right" /></div></section>
    </>
  );
}