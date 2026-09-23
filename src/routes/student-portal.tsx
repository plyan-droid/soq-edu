import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpenCheck, CalendarClock, ClipboardCheck, FileText, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site-content";

export const Route = createFileRoute("/student-portal")({
  head: () => ({
    meta: [
      { title: "Student Portal | SOQ International Academy" },
      { name: "description", content: "Sign in to the SOQ student portal to track your course progress, class schedule, deadlines and assessments." },
      { property: "og:title", content: "SOQ Student Portal" },
      { property: "og:description", content: "Track course progress, schedules, deadlines and assessments in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentPortal,
});

const features = [
  { icon: BookOpenCheck, title: "Course progress", text: "See the modules you have finished and what comes next." },
  { icon: CalendarClock, title: "Class schedule", text: "Check upcoming class dates, times and venues." },
  { icon: ClipboardCheck, title: "Assessments", text: "View upcoming assessments and your results." },
  { icon: FileText, title: "Learning materials", text: "Download course notes and handouts." },
];

function StudentPortal() {
  return (
    <>
      <section className="bg-brand-navy text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="self-center">
            <p className="font-script text-3xl text-brand-gold">Welcome back</p>
            <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">Your SOQ student portal</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-primary-foreground/75">Track your course progress, class dates, deadlines and assessments. Sign in with the login details SOQ sent you when you enrolled.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-full bg-brand-gold px-7 text-brand-navy hover:bg-brand-gold/85">
                <a href={contact.portal} target="_blank" rel="noreferrer">Sign in to portal <ArrowRight /></a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-primary-foreground/30 bg-transparent px-7 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={contact.whatsapp}>Need help signing in?</a>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-6">
                <Icon className="size-7 text-brand-gold" />
                <h2 className="mt-4 font-serif text-2xl">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col items-start gap-6 rounded-lg border border-border bg-card p-8 md:flex-row md:items-center">
          <LifeBuoy className="size-10 shrink-0 text-brand-gold" />
          <div className="flex-1">
            <h2 className="font-serif text-3xl text-primary">Forgot your login or missing a class?</h2>
            <p className="mt-2 text-muted-foreground">Message our student services team on WhatsApp ({contact.whatsappDisplay ?? "+65 8718 2308"}) or email {contact.email}. Remember: you need at least 75% attendance to complete your course.</p>
          </div>
          <Button asChild className="rounded-full"><a href={`mailto:${contact.email}`}>Email us</a></Button>
        </div>
      </section>
    </>
  );
}
