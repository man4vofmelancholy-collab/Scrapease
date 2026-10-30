import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { RequestCard } from "@/components/request-card";
import { StateMessage } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequestsQuery, setFinalTotal, updateRequestStatus, type PickupRequest } from "@/lib/api/pickups";
import { nextStatuses, STATUS_LABELS, type PickupStatus } from "@/lib/domain/pickup";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminRequests,
});

const FILTERS: (PickupStatus | "all")[] = ["all", "pending", "confirmed", "assigned", "picked_up", "completed", "cancelled"];

function AdminRequests() {
  const [status, setStatus] = useState<PickupStatus | "all">("all");
  const { data, isLoading, error } = useQuery(adminRequestsQuery(status));
  return (
    <div>
      <h1 className="text-2xl font-bold">Pickup requests</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>
            {f === "all" ? "All" : STATUS_LABELS[f]}
          </Button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage>Couldn't load requests.</StateMessage>}
        {data?.length === 0 && <StateMessage>No requests here.</StateMessage>}
        {data?.map((r) => <RequestCard key={r.id} r={r} showContact actions={<Actions r={r} />} />)}
      </div>
    </div>
  );
}

function Actions({ r }: { r: PickupRequest }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [final, setFinal] = useState(r.final_total?.toString() ?? "");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-requests"] });

  async function move(to: PickupStatus) {
    setBusy(true);
    try { await updateRequestStatus(r.id, to); toast.success(`Marked ${STATUS_LABELS[to]}`); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Update failed"); }
    finally { setBusy(false); }
  }
  async function saveFinal() {
    const n = Number(final);
    if (!(n >= 0)) return void toast.error("Enter a valid amount");
    setBusy(true);
    try { await setFinalTotal(r.id, n); toast.success("Final amount saved"); await refresh(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
    finally { setBusy(false); }
  }
  const next = nextStatuses(r.status);
  return (
    <div className="space-y-3">
      {next.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {next.map((s) => (
            <Button key={s} size="sm" disabled={busy} variant={s === "cancelled" ? "outline" : "default"} onClick={() => move(s)}>
              {s === "cancelled" ? "Cancel" : `Mark ${STATUS_LABELS[s]}`}
            </Button>
          ))}
        </div>
      )}
      {(r.status === "picked_up" || r.status === "completed") && (
        <div className="flex gap-2">
          <Input type="number" min="0" step="0.01" placeholder="Final amount (₹)" value={final} onChange={(e) => setFinal(e.target.value)} />
          <Button size="sm" variant="secondary" disabled={busy} onClick={saveFinal}>Save</Button>
        </div>
      )}
    </div>
  );
}
