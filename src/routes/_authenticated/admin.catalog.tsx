import { createFileRoute, redirect } from "@tanstack/react-router";

// Old URL kept working.
export const Route = createFileRoute("/_authenticated/admin/catalog")({
  beforeLoad: () => { throw redirect({ to: "/admin/categories", replace: true }); },
});
