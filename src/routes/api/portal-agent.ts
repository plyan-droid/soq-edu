import { createFileRoute } from "@tanstack/react-router";
import { handlePortalAgent } from "@/lib/portal-agent.server";

export const Route = createFileRoute("/api/portal-agent")({
  server: { handlers: { POST: ({ request }) => handlePortalAgent(request) } },
});
