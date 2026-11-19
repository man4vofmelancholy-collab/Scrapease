import { createFileRoute, Outlet } from "@tanstack/react-router";
import { StateMessage } from "@/components/site-layout";
import { useAuth } from "@/hooks/use-auth";

// UI gate only — every admin read/write is also enforced by database role policies.
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Suhani Traders" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10"><StateMessage>Checking access…</StateMessage></main>;
  if (!isAdmin) return <main className="mx-auto max-w-6xl px-4 py-10"><StateMessage>You don't have admin access.</StateMessage></main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Outlet />
    </main>
  );
}
