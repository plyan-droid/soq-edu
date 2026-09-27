import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarClock, ClipboardCheck, FileText, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

export type Task = { id: string; enrollment_id: string; kind: string; title: string; due_at: string; status: string; result: string | null };
export type Enrollment = { id: string; course_slug: string; progress: number; start_date: string | null; end_date: string | null; status: string };

type MyApp = { id: string; course_slug: string; preferred_intake: string | null; status: string; created_at: string };
const statusLabel: Record<string, string> = { new: "Received", contacted: "Adviser contacted you", enrolled: "Enrolled", closed: "Closed" };

export const courseTitle = (slug: string) => courses.find(c => c.slug === slug)?.title ?? slug;
const fmt = (d: string) => new Date(d).toLocaleString("en-SG", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function StudentDashboard({ userId, email, isAdmin }: { userId: string; email: string; isAdmin: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["portal", userId, email],
    queryFn: async () => {
      const { data: enr, error } = await supabase.from("enrollments").select("*").eq("student_id", userId).order("created_at");
      if (error) throw error;
      const ids = (enr ?? []).map(e => e.id);
      const { data: tasks } = ids.length ? await supabase.from("course_tasks").select("*").in("enrollment_id", ids).order("due_at") : { data: [] };
      const { data: apps } = await supabase.from("course_applications").select("id,course_slug,preferred_intake,status,created_at").ilike("email", email).order("created_at", { ascending: false });
      return { enrollments: (enr ?? []) as Enrollment[], tasks: (tasks ?? []) as Task[], apps: (apps ?? []) as MyApp[] };
    },
  });
  const now = Date.now();
  const upcoming = (data?.tasks ?? []).filter(t => t.status === "upcoming" && new Date(t.due_at).getTime() >= now - 864e5);
  const completed = (data?.tasks ?? []).filter(t => t.status !== "upcoming");

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Signed in as {email}</p>
        {isAdmin && <Button asChild variant="outline" className="rounded-full"><Link to="/portal-admin"><Settings /> Staff admin</Link></Button>}
      </div>

      {!isLoading && data && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[["Applications", String(data.apps.length)], ["Active courses", String(data.enrollments.filter(e => e.status === "active").length)], ["Next deadline", upcoming[0] ? new Date(upcoming[0].due_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" }) : "None"]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{l}</p><p className="mt-1 font-serif text-4xl text-primary">{v}</p></div>
          ))}
        </div>
      )}

      {!isLoading && (data?.apps.length ?? 0) > 0 && (
        <div className="mt-8 rounded-lg border border-border bg-card p-6">
          <h2 className="flex items-center gap-2 font-serif text-3xl text-primary"><FileText className="size-5 text-brand-gold" /> My applications</h2>
          <ul className="mt-4 divide-y divide-border">{data!.apps.map(a => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div><Link to="/courses/$slug" params={{ slug: a.course_slug }} className="font-medium text-primary hover:text-brand-gold">{courseTitle(a.course_slug)}</Link>
                <p className="text-muted-foreground">Sent {new Date(a.created_at).toLocaleDateString("en-SG")}{a.preferred_intake ? ` · Intake: ${a.preferred_intake}` : ""}</p></div>
              <span className="rounded-full bg-brand-gold-soft px-3 py-1 text-xs font-semibold text-primary">{statusLabel[a.status] ?? a.status}</span>
            </li>
          ))}</ul>
        </div>
      )}

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
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{t.filter(x => x.status === "done").length} of {t.length} items completed</p><Link to="/learn/$slug" params={{ slug: e.course_slug }} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Open lessons &amp; live classes</Link></div>
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
