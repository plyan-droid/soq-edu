import { createFileRoute } from "@tanstack/react-router";
import { StudentClassroom } from "@/components/student-classroom";

export const Route = createFileRoute("/learn/$slug")({
  head: () => ({ meta: [
    { title: "My Class | SOQ International Academy" },
    { name: "description", content: "Access your SOQ class lessons, assignments, announcements and live sessions." },
    { property: "og:title", content: "My Class | SOQ International Academy" },
    { property: "og:description", content: "Your SOQ class lessons, assignments, announcements and live sessions." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: LearnPage,
});

function LearnPage() {
  const { slug } = Route.useParams();
  return <StudentClassroom slug={slug} />;
}
