import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

export type Task = { id: string; enrollment_id: string; kind: string; title: string; due_at: string; status: string; result: string | null };
export type Enrollment = { id: string; course_slug: string; progress: number; start_date: string | null; end_date: string | null; status: string };
type Application = { id: string; course_slug: string; preferred_intake: string | null; status: string; created_at: string };
const statusLabel: Record<string, string> = { new: "Received", contacted: "Adviser contacted you", enrolled: "Enrolled", closed: "Closed", waitlist: "Waitlisted" };
export const courseTitle = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;

export function StudentDashboard({ userId, email }: { userId: string; email: string; isAdmin: boolean }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["student-classes", userId, email],
    queryFn: async () => {
      const [enrolments, applications, assignments, submissions] = await Promise.all([
        supabase.from("enrollments").select("id,course_slug,progress,start_date,end_date,status").eq("student_id", userId).order("created_at", { ascending: false }),
        supabase.from("course_applications").select("id,course_slug,preferred_intake,status,created_at").ilike("email", email).order("created_at", { ascending: false }),
        supabase.from("assignments").select("id,course_slug,title,due_at").order("due_at", { nullsFirst: false }),
        supabase.from("assignment_submissions").select("assignment_id").eq("student_id", userId),
      ]);
      if (enrolments.error) throw enrolments.error;
      return { enrolments: (enrolments.data ?? []) as Enrollment[], applications: (applications.data ?? []) as Application[], assignments: assignments.data ?? [], submitted: new Set((submissions.data ?? []).map(s => s.assignment_id)) };
    },
  });
  if (isPending) return <div className="mt-6 grid gap-4 md:grid-cols-2"><Skeleton className="h-52" /><Skeleton className="h-52" /></div>;
  if (error || !data) return <p className="mt-6 text-sm text-destructive">Your courses could not be loaded. Please refresh and try again.</p>;
  const enrolled = data.enrolments.filter(e => e.status !== "withdrawn");
  const now = Date.now();
  return <div className="mt-6 space-y-10">
    <section>
      <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-muted-foreground">Your classes</p><h2 className="mt-1 font-serif text-3xl text-primary">My courses</h2></div><span className="text-sm text-muted-foreground">{enrolled.length} {enrolled.length === 1 ? "course" : "courses"}</span></div>
      {enrolled.length ? <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{enrolled.map(e => {
        const course = courses.find(c => c.slug === e.course_slug);
        const next = data.assignments.filter(a => a.course_slug === e.course_slug && !data.submitted.has(a.id) && (!a.due_at || new Date(a.due_at).getTime() >= now)).sort((a,b) => (a.due_at ?? "").localeCompare(b.due_at ?? ""))[0];
        return <article key={e.id} className="flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card">
          <div className="relative h-32 bg-secondary">{course?.image && <img src={course.image} alt="" className="h-full w-full object-cover" />}<span className="absolute bottom-3 left-4 rounded-sm bg-background px-2 py-1 text-xs font-medium capitalize text-foreground">{e.status}</span></div>
          <div className="flex flex-1 flex-col p-5"><h3 className="font-serif text-2xl leading-tight text-primary">{courseTitle(e.course_slug)}</h3><p className="mt-3 text-xs text-muted-foreground">{e.progress}% complete</p><div className="mt-1 h-1.5 overflow-hidden bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${Math.max(0, Math.min(100, e.progress))}%` }} /></div>
            <div className="mt-4 min-h-12 border-t border-border pt-3 text-sm">{next ? <><p className="font-medium">Next: {next.title}</p><p className="text-xs text-muted-foreground">{next.due_at ? `Due ${new Date(next.due_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "No due date"}</p></> : <p className="text-muted-foreground">No work due soon</p>}</div>
            <Button asChild variant="outline" className="mt-4 w-full justify-between"><Link to="/learn/$slug" params={{ slug: e.course_slug }}>Open class <ArrowRight className="size-4" /></Link></Button>
          </div>
        </article>;
      })}</div> : <div className="mt-5 border-t border-border py-8"><BookOpen className="size-6 text-brand-gold" /><h3 className="mt-3 font-serif text-2xl text-primary">No courses linked yet</h3><p className="mt-2 max-w-xl text-sm text-muted-foreground">Once your enrolment is confirmed, your class will appear here.</p><Button asChild className="mt-4"><Link to="/courses">Browse courses <ArrowRight className="size-4" /></Link></Button></div>}
    </section>
    {data.applications.length > 0 && <section className="border-t border-border pt-7"><h2 className="font-serif text-2xl text-primary">My applications</h2><ul className="mt-3 divide-y divide-border">{data.applications.map(a => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><Link to="/courses/$slug" params={{ slug: a.course_slug }} className="font-medium text-primary underline-offset-2 hover:underline">{courseTitle(a.course_slug)}</Link><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="size-3" /> Sent {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}{a.preferred_intake ? ` · ${a.preferred_intake}` : ""}</p></div><span className="text-xs font-medium text-muted-foreground">{statusLabel[a.status] ?? a.status}</span></li>)}</ul></section>}
  </div>;
}
