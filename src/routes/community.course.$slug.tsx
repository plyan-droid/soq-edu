import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StudentClassroom } from "@/components/student-classroom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

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
  if (isLoading && !isAdmin) return <p className="mx-auto max-w-7xl px-5 py-12 text-muted-foreground">Checking your course…</p>;
  if (!member && !isAdmin) return <div className="mx-auto max-w-7xl px-5 py-12"><p className="text-muted-foreground">This class is for enrolled students and its trainers.</p><Link to="/community" className="mt-3 inline-block text-primary underline">Back to Community</Link></div>;
  return <StudentClassroom slug={slug} />;
}
