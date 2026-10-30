import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { StateMessage } from "@/components/site-layout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — ScrapEase" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, isLoading } = useAuth();
  if (isLoading) return <main className="mx-auto max-w-6xl px-4 py-10"><StateMessage>Checking access…</StateMessage></main>;
  if (!isAdmin) return <main className="mx-auto max-w-6xl px-4 py-10"><StateMessage>You don't have admin access.</StateMessage></main>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex gap-4 border-b pb-3 text-sm">
        <Link to="/admin" activeOptions={{ exact: true }} activeProps={{ className: "font-semibold text-primary" }}>Pickup requests</Link>
        <Link to="/admin/catalog" activeProps={{ className: "font-semibold text-primary" }}>Categories & rates</Link>
      </div>
      <Outlet />
    </main>
  );
}
