import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommunityMobileNav, CommunitySidebar } from "@/components/community-sidebar";
import { ClassroomForum } from "@/components/classroom-forum";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { courses } from "@/lib/site-content";

export const Route = createFileRoute("/community/course/$slug")({
  head: () => ({ meta: [
    { title: "My Course Discussions | SOQ Community" },
    { name: "description", content: "Private discussions for your SOQ course." },
    { property: "og:title", content: "SOQ Course Discussions" },
    { property: "og:description", content: "Private discussions for SOQ course members." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CourseDiscussion,
});

function CourseDiscussion() {
  const { slug } = Route.useParams();
  const { user, loading, isAdmin } = useAuth();
  const course = courses.find(c => c.slug === slug);
  const { data: member, isLoading } = useQuery({
    enabled: !!user && !loading && !isAdmin,
    queryKey: ["course-discussion-access", user?.id, slug],
    queryFn: async () => {
      const [enrolled, teaching] = await Promise.all([
        supabase.from("enrollments").select("id").eq("student_id", user?.id ?? "").eq("course_slug", slug).limit(1),
        supabase.from("trainer_courses").select("course_slug").eq("trainer_id", user?.id ?? "").eq("course_slug", slug).limit(1),
      ]);
      return !!enrolled.data?.length || !!teaching.data?.length;
    },
  });
  if (loading) return <div className="mx-auto max-w-7xl px-5 py-16">Loading…</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-5 py-20"><h1 className="font-serif text-4xl text-primary">My Course</h1><p className="mt-3">Please <Link to="/login" className="underline">sign in</Link> to join your course discussions.</p></div>;
  return <>
    <section className="border-b border-border bg-secondary"><div className="mx-auto max-w-7xl px-5 py-8 lg:px-8"><Link to="/community" className="text-sm text-muted-foreground hover:text-primary">← Community</Link><h1 className="mt-2 font-serif text-4xl text-primary">{course?.title ?? slug}</h1><p className="mt-1 text-sm text-muted-foreground">Class discussions</p></div></section>
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[220px_1fr] lg:px-8"><CommunitySidebar active={`course:${slug}`} /><main className="min-w-0"><CommunityMobileNav active={`course:${slug}`} />{isLoading && !isAdmin ? <p className="text-muted-foreground">Checking your course…</p> : member || isAdmin ? <ClassroomForum slug={slug} user={user} isStaff={isAdmin} /> : <p className="text-muted-foreground">This discussion is for students and trainers in this course.</p>}</main></section>
  </>;
}
