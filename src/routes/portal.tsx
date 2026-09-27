import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/portal")({
  beforeLoad: () => {
    throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [{ title: "Portal — SOQ International Academy" }],
  }),
  component: () => null,
});
