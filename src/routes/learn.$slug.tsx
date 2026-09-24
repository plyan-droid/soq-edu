import { LessonNotes, CourseChatroom } from "@/components/student-extras";
import { CourseNoticesList, StudentQuizzes, StudentAssignments } from "@/components/learner-tools";
import { Lock } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, Circle, Download, PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { embedUrl, fmtDateTime, safeHref, type Lesson, type LiveSession } from "@/lib/learning";

export const Route = createFileRoute("/learn/$slug")({
  head: () => ({
    meta: [
      { title: "Course Lessons | SOQ International Academy" },
      { name: "description", content: "Watch lessons, download materials and join live classes for your SOQ course." },
      { property: "og:title", content: "SOQ Course Lessons" },
      { property: "og:description", content: "Lessons, materials and live classes for enrolled SOQ students." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LearnPage,
});

function LearnPage() {
  const { slug } = Route.useParams();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const course = courses.find(c => c.slug === slug);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["learn", slug, user?.id],
    queryFn: async () => {
      const [l, s, p] = await Promise.all([
        supabase.from("lessons").select("*").eq("course_slug", slug).order("position").order("created_at"),
        supabase.from("live_sessions").select("*").eq("course_slug", slug).neq("status", "cancelled").gte("starts_at", new Date(Date.now() - 3 * 3600e3).toISOString()).order("starts_at"),
        supabase.from("lesson_progress").select("lesson_id").eq("user_id", user!.id),
      ]);
      return { lessons: (l.data ?? []) as Lesson[], live: (s.data ?? []) as LiveSession[], done: new Set((p.data ?? []).map(x => x.lesson_id)) };
    },
  });

  if (loading) return <Shell><p className="text-muted-foreground">Loading…</p></Shell>;
  if (!user) return <Shell><p className="text-muted-foreground">Please <Link to="/login" className="underline">log in</Link> to open your lessons.</p></Shell>;

  const lessons = data?.lessons ?? [];
  const active = lessons.find(l => l.id === activeId) ?? lessons[0];
  const locked = (l: Lesson, i: number) => (!!l.unlock_at && new Date(l.unlock_at) > new Date());
  const doneCount = lessons.filter(l => data?.done.has(l.id)).length;

  const toggleDone = async (l: Lesson) => {
    if (data?.done.has(l.id)) await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", l.id);
    else await supabase.from("lesson_progress").insert({ user_id: user.id, lesson_id: l.id });
    void qc.invalidateQueries({ queryKey: ["learn", slug] });
  };

  return (
    <Shell title={course?.title ?? slug}>
      {isLoading ? <p className="text-muted-foreground">Loading lessons…</p> : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <CourseNoticesList slug={slug} />
            {active && locked(active, lessons.indexOf(active)) ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground"><Lock className="mx-auto mb-2 size-6" />"{active.title}" opens on {fmtDateTime(active.unlock_at!)}.</div>
            ) : !active ? (
              <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
                No lessons yet. If you're enrolled, your trainer will add them here. If you're not enrolled in this course, lessons stay hidden.
              </div>
            ) : (
              <article className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-serif text-3xl text-primary">{active.title}</h2>
                {embedUrl(active.video_url) ? (
                  <div className="mt-5 aspect-video overflow-hidden rounded-md bg-muted"><iframe className="h-full w-full" src={embedUrl(active.video_url)!} title={active.title} allowFullScreen /></div>
                ) : active.video_url && <a href={safeHref(active.video_url)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 underline"><PlayCircle className="size-4" /> Watch video</a>}
                {active.body && <p className="mt-5 whitespace-pre-line leading-7">{active.body}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  {active.file_url && <Button asChild variant="outline" className="rounded-full"><a href={safeHref(active.file_url)} target="_blank" rel="noreferrer"><Download /> Download materials</a></Button>}
                  <Button className="rounded-full" onClick={() => void toggleDone(active)}>{data?.done.has(active.id) ? "Mark as not done" : "Mark as done"}</Button>
                </div>
              </article>
            )}
            {active && <LessonNotes lessonId={active.id} />}
          </div>
          <aside className="space-y-6">
            <CourseChatroom slug={slug} />
            <StudentQuizzes slug={slug} />
            <StudentAssignments slug={slug} />
            <div className="rounded-lg border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">{doneCount} of {lessons.length} lessons done</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${lessons.length ? (doneCount / lessons.length) * 100 : 0}%` }} /></div>
              <ol className="mt-4 space-y-1">
                {lessons.map((l, i) => (
                  <li key={l.id}><button onClick={() => setActiveId(l.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted ${active?.id === l.id ? "bg-muted font-medium" : ""}`}>
                    {locked(l, i) ? <Lock className="size-4 shrink-0 text-muted-foreground" /> : data?.done.has(l.id) ? <CheckCircle2 className="size-4 shrink-0 text-brand-gold" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}{i + 1}. {l.title}
                  </button></li>
                ))}
              </ol>
            </div>
            <div className="rounded-lg border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Video className="size-5" /> Live classes</h3>
              {(data?.live.length ?? 0) === 0 ? <p className="mt-2 text-sm text-muted-foreground">No live classes scheduled.</p> : (
                <ul className="mt-3 space-y-3">{data!.live.map(s => (
                  <li key={s.id} className="text-sm"><p className="font-medium">{s.title}</p><p className="text-muted-foreground">{fmtDateTime(s.starts_at)} · {s.duration_min} min</p>
                    {s.meeting_url && <a href={safeHref(s.meeting_url)} target="_blank" rel="noreferrer" className="text-primary underline">Join class</a>}</li>))}</ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </Shell>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <Link to="/student-portal" className="text-sm text-muted-foreground hover:text-primary">← My learning</Link>
      {title && <h1 className="mt-3 mb-8 font-serif text-4xl text-primary md:text-5xl">{title}</h1>}
      <div className={title ? "" : "mt-6"}>{children}</div>
    </div>
  );
}
