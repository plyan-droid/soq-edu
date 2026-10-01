import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/staff-courses")({
  beforeLoad: () => {
    throw redirect({ to: "/portal-admin", search: { tool: "intakes" } as never });
  },
  component: () => null,
});
