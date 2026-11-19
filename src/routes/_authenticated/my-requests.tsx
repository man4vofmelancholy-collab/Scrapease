import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, StateMessage } from "@/components/site-layout";
import { RequestCard } from "@/components/request-card";
import { myRequestsQuery } from "@/lib/api/pickups";

export const Route = createFileRoute("/_authenticated/my-requests")({
  head: () => ({ meta: [{ title: "My pickup requests — Suhani Traders" }] }),
  component: MyRequests,
});

function MyRequests() {
  const { user } = Route.useRouteContext();
  const { data, isLoading, error } = useQuery(myRequestsQuery(user.id));
  return (
    <PageShell title="My pickup requests" subtitle="Requests you submitted while signed in.">
      {isLoading && <StateMessage>Loading…</StateMessage>}
      {error && <StateMessage>Couldn't load requests.</StateMessage>}
      {data?.length === 0 && (
        <StateMessage>No requests yet. <Link to="/sell" className="text-primary">Book a pickup</Link></StateMessage>
      )}
      <div className="grid gap-4 md:grid-cols-2">{data?.map((r) => <RequestCard key={r.id} r={r} />)}</div>
    </PageShell>
  );
}
