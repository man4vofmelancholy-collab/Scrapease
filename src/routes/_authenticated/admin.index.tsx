import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { StateMessage } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { dashboardQuery } from "@/lib/api/admin";
import { currentRatesQuery } from "@/lib/api/catalog";
import { summarizeOrders } from "@/lib/domain/admin";
import { formatINR, STATUS_LABELS, UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — ScrapEase Admin" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Stat({ label, value, to }: { label: string; value: number | string; to?: "/admin/orders" | "/admin/enquiries" }) {
  const body = (
    <div className="rounded-lg border bg-card p-5 transition-colors hover:border-primary">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}

function Dashboard() {
  const { data, isLoading, error } = useQuery(dashboardQuery);
  const rates = useQuery(currentRatesQuery);
  if (isLoading) return <StateMessage>Loading dashboard…</StateMessage>;
  if (error || !data) return <StateMessage>Couldn't load dashboard data.</StateMessage>;
  const s = summarizeOrders(data.orders);
  const paid = data.orders.filter((o) => o.status === "completed").reduce((t, o) => t + (o.final_total ?? o.estimated_total), 0);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live overview of your scrap business.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total orders" value={s.total} to="/admin/orders" />
        <Stat label="Pending" value={s.pending} to="/admin/orders" />
        <Stat label="Completed" value={s.completed} to="/admin/orders" />
        <Stat label="Cancelled" value={s.cancelled} to="/admin/orders" />
        <Stat label="In progress" value={s.inProgress} to="/admin/orders" />
        <Stat label="Registered customers" value={data.customerCount} />
        <Stat label="New enquiries" value={data.newEnquiries} to="/admin/enquiries" />
        <Stat label="Paid out (completed)" value={formatINR(paid)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary">View all →</Link>
          </div>
          {data.orders.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p> : (
            <ul className="mt-3 divide-y text-sm">
              {data.orders.slice(0, 8).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{o.request_code} · {new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={o.status === "cancelled" ? "outline" : "secondary"}>{STATUS_LABELS[o.status]}</Badge>
                    <p className="mt-1 text-xs">{formatINR(o.final_total ?? o.estimated_total)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Categories & current rates</h2>
            <Link to="/admin/rates" className="text-sm text-primary">Manage →</Link>
          </div>
          {rates.isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
          <ul className="mt-3 divide-y text-sm">
            {rates.data?.map((r) => (
              <li key={r.category_id} className="flex justify-between py-2">
                <span>{r.name}</span>
                <span className="font-medium">{formatINR(r.rate_per_unit)} / {UNIT_LABELS[r.unit]}</span>
              </li>
            ))}
          </ul>
          {rates.data && <p className="mt-2 text-xs text-muted-foreground">{rates.data.length} active categories shown to customers.</p>}
        </section>
      </div>
    </div>
  );
}
