import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Circle, Download, Lock, PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/start-here";
import { SessionBookButton } from "@/components/session-bookings";
import { LessonNotes } from "@/components/student-extras";
import { CourseNoticesList, StudentQuizzes, StudentAssignments } from "@/components/learner-tools";
import { ClassroomForum } from "@/components/classroom-forum";
import { DemoClasswork, DemoGrades, DemoStreamWork } from "@/components/classroom-demo-work";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { courses } from "@/lib/site-content";
import { embedUrl, fmtDateTime, safeHref, type Lesson, type LiveSession } from "@/lib/learning";

type Tab = "stream" | "classwork" | "grades";
const tabs: { id: Tab; label: string }[] = [{ id: "stream", label: "Stream" }, { id: "classwork", label: "Classwork" }, { id: "grades", label: "Grades" }];
function tabFromHash(hash: string): Tab { return hash.startsWith("#assignment-") || hash.startsWith("#quiz-") || hash.startsWith("#lesson-") || hash === "#live-classes" ? "classwork" : hash === "#work" ? "grades" : tabs.find(t => `#${t.id}` === hash)?.id ?? "stream"; }

export function StudentClassroom({ slug }: { slug: string }) {
  const { user, loading, isAdmin, isTrainer } = useAuth();
  const qc = useQueryClient();
  const course = courses.find(c => c.slug === slug);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("stream");
  const [demoWorkOpen, setDemoWorkOpen] = useState(false);
  const { data, isPending } = useQuery({ enabled: !!user, queryKey: ["learn", slug, user?.id], queryFn: async () => {
    const [membership, l, s, p, a, sub, q, attempts] = await Promise.all([
      supabase.from("enrollments").select("id").eq("course_slug", slug).eq("student_id", user?.id ?? "").neq("status", "withdrawn").limit(1),
      supabase.from("lessons").select("*").eq("course_slug", slug).order("position").order("created_at"),
      supabase.from("live_sessions").select("*").eq("course_slug", slug).neq("status", "cancelled").gte("starts_at", new Date(Date.now() - 3 * 3600e3).toISOString()).order("starts_at"),
      supabase.from("lesson_progress").select("lesson_id").eq("user_id", user?.id ?? ""),
      supabase.from("assignments").select("id,title,due_at,max_score").eq("course_slug", slug).order("due_at", { nullsFirst: false }),
      supabase.from("assignment_submissions").select("assignment_id,status,score,feedback").eq("student_id", user?.id ?? ""),
      supabase.from("quizzes").select("id,title").eq("course_slug", slug),
      supabase.from("quiz_attempts").select("quiz_id,score,passed").eq("student_id", user?.id ?? ""),
    ]);
    return { member: !!membership.data?.length, lessons: (l.data ?? []) as Lesson[], live: (s.data ?? []) as LiveSession[], done: new Set((p.data ?? []).map(x => x.lesson_id)), assignments: a.data ?? [], submissions: sub.data ?? [], quizzes: q.data ?? [], attempts: attempts.data ?? [] };
  } });
  useEffect(() => {
    const sync = () => { setTab(tabFromHash(window.location.hash)); const id = window.location.hash.slice(1); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "smooth" }), 150); };
    sync(); window.addEventListener("hashchange", sync); return () => window.removeEventListener("hashchange", sync);
  }, [slug, isPending]);
  if (loading) return <Shell slug={slug}><ListSkeleton /></Shell>;
  if (!user) return <Shell slug={slug}><p className="text-muted-foreground">Please <Link to="/login" className="underline">log in</Link> to open your class.</p></Shell>;
  if (isPending) return <Shell slug={slug}><ListSkeleton /></Shell>;
  if (!data?.member && !isAdmin && !isTrainer) return <Shell slug={slug}><p className="text-muted-foreground">This class is available to enrolled students. If you have already enrolled, contact SOQ to link your account.</p><Button asChild variant="link" className="px-0"><Link to="/student-portal">Back to my courses</Link></Button></Shell>;
  const lessons = data?.lessons ?? [];
  const active = lessons.find(l => l.id === activeId) ?? lessons[0];
  const locked = (l: Lesson) => !!l.unlock_at && new Date(l.unlock_at) > new Date();
  const doneCount = lessons.filter(l => data?.done.has(l.id)).length;
  const activeIndex = active ? lessons.findIndex(l => l.id === active.id) : -1;
  const toggleDone = async (l: Lesson) => {
    if (data?.done.has(l.id)) await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_id", l.id);
    else await supabase.from("lesson_progress").insert({ user_id: user.id, lesson_id: l.id });
    void qc.invalidateQueries({ queryKey: ["learn", slug] }); void qc.invalidateQueries({ queryKey: ["student-home", user.id] });
  };
  const selectTab = (next: Tab) => { setTab(next); window.history.replaceState(window.history.state, "", `#${next}`); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const submissions = data?.submissions ?? [];
  const showDemo = user.email === "student@demo.com" || /^demo-student\d+@demo\.com$/.test(user.email ?? "");
  const openDemoWork = () => { setDemoWorkOpen(true); selectTab("classwork"); };
  return <Shell slug={slug} title={course?.title ?? slug}>
    <div role="tablist" aria-label="Class areas" className="-mx-5 mb-7 flex overflow-x-auto border-b border-border px-5 sm:mx-0 sm:px-0">{tabs.map(t => <Button key={t.id} type="button" variant="ghost" role="tab" aria-selected={tab === t.id} onClick={() => selectTab(t.id)} className={`h-11 shrink-0 rounded-none border-b-2 px-4 ${tab === t.id ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground"}`}>{t.label}</Button>)}</div>
    {tab === "stream" && <div id="stream" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]"><div className="min-w-0"><CourseNoticesList slug={slug} pinnedOnly /><div id="discussion" className="scroll-mt-6"><ClassroomForum slug={slug} user={user} isStaff={isAdmin || isTrainer} courseTitle={course?.title ?? slug} /></div>{showDemo && <div className="mt-8"><DemoStreamWork slug={slug} openClasswork={openDemoWork} /></div>}<CourseNoticesList slug={slug} unpinnedOnly /></div><aside className="self-start border-t border-border pt-4 lg:sticky lg:top-6"><h3 className="text-sm font-semibold text-primary">Upcoming</h3><ul className="mt-3 divide-y divide-border">{data?.assignments.filter(a => !submissions.some(s => s.assignment_id === a.id)).slice(0, 4).map(a => <li key={a.id} className="py-3 text-sm"><a href={`#assignment-${a.id}`} onClick={() => setTab("classwork")} className="font-medium text-primary hover:underline">{a.title}</a><p className="text-xs text-muted-foreground">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"}</p></li>)}</ul><Button variant="link" className="px-0" onClick={() => selectTab("classwork")}>All classwork →</Button></aside></div>}
    {tab === "classwork" && <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]"><div className="min-w-0 space-y-7">{showDemo && <DemoClasswork slug={slug} expanded={demoWorkOpen} onToggle={() => setDemoWorkOpen(v => !v)} />}<section><StudentAssignments slug={slug} /></section><section><StudentQuizzes slug={slug} /></section><section><h2 className="font-serif text-2xl text-primary">Lessons & materials</h2>{!lessons.length ? <p className="mt-3 text-sm text-muted-foreground">Your trainer has not added lessons yet.</p> : <div className="mt-4 grid gap-6"><ol className="divide-y divide-border border-y border-border">{lessons.map((l, i) => <li key={l.id} id={`lesson-${l.id}`}><Button variant="ghost" onClick={() => setActiveId(l.id)} className={`h-auto min-h-12 w-full justify-start gap-3 whitespace-normal text-left ${active?.id === l.id ? "bg-secondary font-semibold" : ""}`}>{locked(l) ? <Lock className="size-4 shrink-0" /> : data?.done.has(l.id) ? <CheckCircle2 className="size-4 shrink-0 text-brand-gold" /> : <Circle className="size-4 shrink-0" />}{i + 1}. {l.title}</Button></li>)}</ol>{active && (locked(active) ? <p className="border border-border p-5 text-sm text-muted-foreground">{active.title} opens on {fmtDateTime(active.unlock_at ?? "")}.</p> : <article className="border-t border-border pt-5"><h3 className="font-serif text-2xl text-primary">{active.title}</h3>{embedUrl(active.video_url) ? <div className="mt-4 aspect-video overflow-hidden bg-muted"><iframe className="h-full w-full" src={embedUrl(active.video_url) ?? ""} title={active.title} allowFullScreen /></div> : active.video_url && <a href={safeHref(active.video_url)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary underline"><PlayCircle className="size-4" /> Watch video</a>}{active.body && <p className="mt-5 whitespace-pre-line leading-7">{active.body}</p>}<div className="mt-5 flex flex-wrap gap-3">{active.file_url && <Button asChild variant="outline"><a href={safeHref(active.file_url)} target="_blank" rel="noreferrer"><Download className="size-4" /> Download materials</a></Button>}<Button onClick={() => void toggleDone(active)}>{data?.done.has(active.id) ? "Mark as not done" : "Mark as done"}</Button></div><div className="mt-5 flex justify-between border-t border-border pt-4"><Button variant="ghost" disabled={activeIndex <= 0} onClick={() => setActiveId(lessons[activeIndex - 1]?.id ?? null)}><ChevronLeft /> Previous</Button><Button variant="outline" disabled={activeIndex >= lessons.length - 1} onClick={() => setActiveId(lessons[activeIndex + 1]?.id ?? null)}>Next <ChevronRight /></Button></div><LessonNotes lessonId={active.id} /></article>)}</div>}</section></div><aside className="space-y-6"><section className="border-t border-border pt-4"><p className="text-sm text-muted-foreground">{doneCount} of {lessons.length} lessons done</p><div className="mt-2 h-1.5 bg-muted"><div className="h-full bg-brand-gold" style={{ width: `${lessons.length ? doneCount / lessons.length * 100 : 0}%` }} /></div></section><section id="live-classes" className="border-t border-border pt-4"><h3 className="flex items-center gap-2 font-serif text-2xl text-primary"><Video className="size-5" /> Live classes</h3>{!data?.live.length ? <p className="mt-2 text-sm text-muted-foreground">No live classes scheduled.</p> : <ul className="mt-3 divide-y divide-border">{data.live.map(s => <li key={s.id} className="py-3 text-sm"><p className="font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{fmtDateTime(s.starts_at)} · {s.duration_min} min</p>{s.location && s.mode !== "online" && <p className="text-muted-foreground">{s.location}</p>}{s.meeting_url && <a href={safeHref(s.meeting_url)} target="_blank" rel="noreferrer" className="text-primary underline">Join class</a>}<SessionBookButton sessionId={s.id} userId={user.id} startsAt={s.starts_at} /></li>)}</ul>}</section></aside></div>}
    {tab === "grades" && <section className="max-w-3xl"><h2 className="font-serif text-2xl text-primary">Grades</h2><p className="mt-2 text-sm text-muted-foreground">Your assignment submissions and quiz results for this course.</p>{showDemo && <DemoGrades slug={slug} openClasswork={openDemoWork} />}<div className="mt-5 divide-y divide-border border-y border-border">{data?.assignments.map(a => { const mine = submissions.find(s => s.assignment_id === a.id); const overdue = !mine && a.due_at && new Date(a.due_at) < new Date(); return <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><div><p className="font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"}</p>{mine?.feedback && <p className="mt-2 text-muted-foreground">Trainer feedback: {mine.feedback}</p>}</div><div className="flex items-center gap-3"><span className="font-medium">{mine?.status === "graded" ? `Marked ${mine.score ?? "—"}/${a.max_score}` : mine ? "Handed in" : overdue ? "Overdue" : "To do"}</span><Button asChild variant="outline" size="sm"><a href={`#assignment-${a.id}`} onClick={() => setTab("classwork")}>Open</a></Button></div></div>; })}{data?.quizzes.map(q => { const tries = data.attempts.filter(a => a.quiz_id === q.id); return <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm"><p className="font-medium">{q.title}</p><div className="flex items-center gap-3"><span>{tries.length ? `Best ${Math.max(...tries.map(a => a.score))}%` : "Not attempted"}</span><Button asChild variant="outline" size="sm"><a href={`#quiz-${q.id}`} onClick={() => setTab("classwork")}>Open</a></Button></div></div>; })}{!data?.assignments.length && !data?.quizzes.length && <p className="py-5 text-sm text-muted-foreground">No actual work has been set for this class yet.</p>}</div></section>}
  </Shell>;
}
function Shell({ slug, title, children }: { slug: string; title?: string; children: React.ReactNode }) { return <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10"><CommunityMobileNav active={`course:${slug}`} /><div className="grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]"><CommunitySidebar active={`course:${slug}`} /><main className="min-w-0"><Button asChild variant="link" className="h-auto px-0"><Link to="/community"><ArrowLeft className="size-4" /> Community</Link></Button>{title && <h1 className="mt-3 mb-6 font-serif text-4xl text-primary md:text-5xl">{title}</h1>}<div className={title ? "" : "mt-6"}>{children}</div></main></div></div>; }
