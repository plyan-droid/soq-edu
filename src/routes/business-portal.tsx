import { createFileRoute, Link } from "@tanstack/react-router";
import { BusinessWorkspace } from "@/components/business-workspace";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/business-portal")({
  head: () => ({ meta: [
    { title: "Business Workspace | SOQ International Academy" },
    { name: "description", content: "Manage your SOQ business training package, team seats and course progress." },
    { property: "og:title", content: "SOQ Business Workspace" },
    { property: "og:description", content: "Partner business training and team management at SOQ International Academy." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: BusinessPortal,
});

function BusinessPortal() {
  const { user, isOrg, loading } = useAuth();
  if (loading) return <p className="mx-auto max-w-7xl px-5 py-20 text-muted-foreground">Loading…</p>;
  if (user && isOrg) return <BusinessWorkspace userId={user.id} />;
  return <div className="mx-auto max-w-7xl px-5 py-20"><h1 className="font-serif text-4xl text-primary">Business workspace</h1><p className="mt-3 text-muted-foreground">{user ? "This workspace is available to partner business accounts." : "Sign in with your partner business account to manage your team."}</p><Button asChild className="mt-6"><Link to={user ? "/student-portal" : "/login"}>{user ? "My portal" : "Sign in"}</Link></Button></div>;
}