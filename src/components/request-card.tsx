import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import type { PickupRequest } from "@/lib/api/pickups";
import { formatINR, STATUS_LABELS, UNIT_LABELS } from "@/lib/domain/pickup";

export function RequestCard({ r, actions, showContact }: { r: PickupRequest; actions?: ReactNode; showContact?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold">{r.request_code}</p>
          <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN")}</p>
        </div>
        <Badge variant={r.status === "cancelled" ? "destructive" : r.status === "completed" ? "default" : "secondary"}>
          {STATUS_LABELS[r.status]}
        </Badge>
      </div>
      {showContact && (
        <p className="mt-3 text-sm">
          <strong>{r.customer_name}</strong> · {r.mobile}<br />
          <span className="text-muted-foreground">{r.address}, {r.pincode}</span>
          {r.preferred_date && <><br /><span className="text-muted-foreground">Preferred: {r.preferred_date}</span></>}
        </p>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {r.pickup_request_items.map((i) => (
          <li key={i.id} className="flex justify-between">
            <span>{i.category_name} · {Number(i.quantity)} {UNIT_LABELS[i.unit]} @ {formatINR(Number(i.rate_snapshot))}</span>
            <span>{formatINR(Number(i.line_estimate))}</span>
          </li>
        ))}
      </ul>
      {r.notes && <p className="mt-2 text-sm text-muted-foreground">Note: {r.notes}</p>}
      <div className="mt-3 flex justify-between border-t pt-3 text-sm">
        <span>Estimate (provisional): <strong>{formatINR(Number(r.estimated_total))}</strong></span>
        {r.final_total != null && <span>Final: <strong>{formatINR(Number(r.final_total))}</strong></span>}
      </div>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}
