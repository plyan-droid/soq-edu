import { Home, BookOpen, Award, Wallet } from "lucide-react";
import { StartHere, PageSkeleton } from "@/components/start-here";
import { RequestStaffAccess } from "@/components/staff-phase5";
import { useState } from "react";
import { WorkspaceShell, type WorkspaceSection } from "@/components/workspace-shell";
import { MyCertificates } from "@/components/certificate";
import { MySkillsFuture } from "@/components/skillsfuture";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { StudentDashboard } from "@/components/student-dashboard";
import { NoticesStrip, MyInstalments } from "@/components/learner-tools";
import { ArrowRight, BookOpenCheck, CalendarClock, ClipboardCheck, FileText, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site-content";
import { BusinessWorkspace } from "@/components/business-workspace";

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
  { icon: BookOpenCheck, title: "Students", text: "Course progress, class dates, assessments, payments and certificates." },
  { icon: CalendarClock, title: "Trainers", text: "Your courses, students, sessions, quizzes and attendance." },
  { icon: ClipboardCheck, title: "Businesses", text: "Your package, sponsored employees and their progress." },
  { icon: FileText, title: "SOQ staff", text: "Applications, enrolments, payments and site settings." },
];

function MemberWorkspace({ userId, email, isAdmin, isOrg }: { userId: string; email: string; isAdmin: boolean; isOrg: boolean }) {
  const [active, setActive] = useState("start");
  const sections: WorkspaceSection[] = [
    { name: "Home", icon: Home, items: [
      { id: "start", label: "Home", content: <StartHere role="student" userId={userId} onNavigate={setActive} greeting="Welcome back. Pick up where you left off." /> },
    ] },
    { name: "My courses", icon: BookOpen, items: [
      { id: "courses", label: "My courses", content: <StudentDashboard userId={userId} email={email} isAdmin={isAdmin} /> },
    ] },
    { name: "Certificates", icon: Award, items: [
      { id: "certs", label: "Certificates", content: <MyCertificates userId={userId} /> },
    ] },
    { name: "Payments", icon: Wallet, items: [
      { id: "pay", label: "Instalments", content: <MyInstalments userId={userId} /> },
      { id: "sfc", label: "SkillsFuture Credit", content: <MySkillsFuture userId={userId} email={email} /> },
      ...(!isAdmin ? [{ id: "staff", label: "Request staff access", content: <RequestStaffAccess userId={userId} email={email} /> }] : []),
    ] },
  ];
  return isOrg ? <BusinessWorkspace userId={userId} /> : <WorkspaceShell title="My portal" sections={sections} active={active} onChange={setActive} top={<NoticesStrip />} />;
}

function StudentPortal() {
  const { user, isAdmin, isOrg, loading } = useAuth();
  if (loading) return <PageSkeleton />;
  if (user) return <MemberWorkspace userId={user.id} email={user.email ?? ""} isAdmin={isAdmin} isOrg={isOrg} />;
  return (
    <>
      <section className="bg-brand-navy text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="self-center">
            <p className="font-script text-3xl text-brand-gold">Welcome back</p>
            <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">Your SOQ portal</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-primary-foreground/75">One login for students, trainers, partner businesses and SOQ staff. Sign in and you'll go straight to the dashboard for your account, plus the members-only SOQ Community.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className="h-12 rounded-full bg-brand-gold px-7 text-brand-navy hover:bg-brand-gold/85">
                <Link to="/login">Sign in to portal <ArrowRight /></Link>
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
            <p className="mt-2 text-muted-foreground">Message our student services team on WhatsApp (+65 8718 2308) or email {contact.email}. Remember: you need at least 75% attendance to complete your course.</p>
          </div>
          <Button asChild className="rounded-full"><a href={`mailto:${contact.email}`}>Email us</a></Button>
        </div>
      </section>
    </>
  );
}
