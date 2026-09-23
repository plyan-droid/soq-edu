import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

export type Task = { id: string; enrollment_id: string; kind: string; title: string; due_at: string; status: string; result: string | null };
export type Enrollment = { id: string; course_slug: string; progress: number; start_date: string | null; end_date: string | null; status: string };

export const courseTitle = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const fmt = (d: string) => new Date(d).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function StudentDashboard({ userId, email, isAdmin }: { userId: string; email: string; isAdmin: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["portal", userId],
    queryFn: async () => {
      const { data: enr, error } = await supabase.from("enrollments").select("*").eq("student_id", userId).order("created_at");
      if (error) throw error;
      const ids = (enr ?? []).map(e => e.id);
      const { data: tasks } = ids.length ? await supabase.from("course_tasks").select("*").in("enrollment_id", ids).order("due_at") : { data: [] };
      return { enrollments: (enr ?? []) as Enrollment[], tasks: (tasks ?? []) as Task[] };
    },
  });
  const now = Date.now();
  const upcoming = (data?.tasks ?? []).filter(t => t.status === "upcoming" && new Date(t.due_at).getTime() >= now - 864e5);
  const completed = (data?.tasks ?? []).filter(t => t.status !== "upcoming");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-script text-3xl text-brand-gold">Welcome back</p>
          <h1 className="font-serif text-5xl text-primary">My learning</h1>
          <p className="mt-1 text-sm text-muted-foreground">{email}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && <Button asChild variant="outline" className="rounded-full"><Link to="/portal-admin"><Settings /> Staff admin</Link></Button>}
          <Button variant="ghost" className="rounded-full" onClick={() => void supabase.auth.signOut()}><LogOut /> Sign out</Button>
        </div>
      </div>

      {isLoading ? <p className="mt-10 text-muted-foreground">Loading your courses…</p> : (data?.enrollments.length ?? 0) === 0 ? (
        <div className="mt-10 rounded-lg border border-border bg-card p-8">
          <h2 className="font-serif text-3xl text-primary">No courses linked yet</h2>
          <p className="mt-2 text-muted-foreground">Once SOQ confirms your enrolment, your courses, class dates and assessments will appear here. If you've already enrolled, message us on WhatsApp so we can link your account.</p>
          <Button asChild className="mt-5 rounded-full"><Link to="/courses">Browse courses</Link></Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="grid gap-5">
            {data!.enrollments.map(e => {
              const t = data!.tasks.filter(x => x.enrollment_id === e.id);
              return (
                <div key={e.id} className="rounded-lg border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="rounded-full bg-brand-gold-soft px-3 py-1 text-xs font-semibold capitalize text-primary">{e.status}</span>
                      <h2 className="mt-3 font-serif text-3xl text-primary">{courseTitle(e.course_slug)}</h2>
                      {(e.start_date || e.end_date) && <p className="mt-1 text-sm text-muted-foreground">{e.start_date ?? "?"} – {e.end_date ?? "?"}</p>}
                    </div>
                    <p className="font-serif text-4xl text-primary">{e.progress}%</p>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-gold" style={{ width: `${e.progress}%` }} /></div>
                  <p className="mt-3 text-sm text-muted-foreground">{t.filter(x => x.status === "done").length} of {t.length} items completed</p>
                </div>
              );
            })}
            {completed.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><ClipboardCheck className="size-5 text-brand-gold" /> Results & completed</h3>
                <ul className="mt-4 divide-y divide-border">{completed.map(t => (
                  <li key={t.id} className="flex justify-between gap-3 py-3 text-sm"><span>{t.title}</span><span className="text-muted-foreground capitalize">{t.result ?? t.status}</span></li>
                ))}</ul>
              </div>
            )}
          </div>
          <aside className="self-start rounded-lg bg-brand-navy p-6 text-primary-foreground">
            <h3 className="flex items-center gap-2 font-serif text-2xl"><CalendarClock className="size-5 text-brand-gold" /> Coming up</h3>
            {upcoming.length === 0 ? <p className="mt-4 text-sm text-primary-foreground/70">Nothing scheduled right now.</p> : (
              <ul className="mt-4 grid gap-3">{upcoming.map(t => (
                <li key={t.id} className="rounded-md bg-primary-foreground/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-brand-gold">{t.kind}</p>
                  <p className="font-medium">{t.title}</p>
                  <p className="text-sm text-primary-foreground/70">{fmt(t.due_at)}</p>
                </li>
              ))}</ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
