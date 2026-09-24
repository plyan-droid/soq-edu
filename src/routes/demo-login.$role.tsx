import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDemoLogin } from "@/components/demo-login";
import { DEMO_ROLES, type DemoRole } from "@/lib/demo-login.functions";

export const Route = createFileRoute("/demo-login/$role")({
  head: () => ({ meta: [{ title: "Demo login | SOQ" }, { name: "description", content: "Signing in to an SOQ demo account." }, { property: "og:title", content: "SOQ demo login" }, { property: "og:description", content: "One-click demo sign-in." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: DemoLoginPage,
});

function DemoLoginPage() {
  const { role } = Route.useParams();
  const go = useDemoLogin();
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!(DEMO_ROLES as readonly string[]).includes(role)) { setErr("Unknown demo account."); return; }
    go(role as DemoRole).catch(e => setErr((e as Error).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      {err ? <><h1 className="font-serif text-4xl text-primary">Demo login unavailable</h1><p className="mt-3 text-muted-foreground">{err}</p><Link to="/login" className="mt-6 inline-block underline">Go to Log in</Link></>
        : <p className="text-muted-foreground">Signing you in as the demo {role}…</p>}
    </div>
  );
}
