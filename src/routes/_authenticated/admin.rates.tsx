import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { StateMessage } from "@/components/site-layout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deleteRate } from "@/lib/api/admin";
import { addRate, adminCategoriesQuery, type AdminCategory } from "@/lib/api/catalog";
import { validateRate } from "@/lib/domain/admin";
import { formatINR, UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/_authenticated/admin/rates")({
  head: () => ({ meta: [{ title: "Rates — ScrapEase Admin" }, { name: "robots", content: "noindex" }] }),
  component: Rates,
});

function Rates() {
  const { data, isLoading, error } = useQuery(adminCategoriesQuery);
  return (
    <div>
      <h1 className="text-2xl font-bold">Scrap rates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Setting a new rate publishes it to the website instantly. Older rates stay in history; past orders keep the rate they were booked at.
      </p>
      <div className="mt-6 space-y-4">
        {isLoading && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage>Couldn't load rates.</StateMessage>}
        {data?.map((c) => <RateRow key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function RateRow({ c }: { c: AdminCategory }) {
  const qc = useQueryClient();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const current = c.scrap_rates[0];

  async function save() {
    const n = validateRate(value);
    if (n === null) return void toast.error("Enter a rate above ₹0");
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      await addRate(c.id, n, data.user!.id);
      setValue("");
      toast.success(`${c.name} rate set to ${formatINR(n)}`);
      await qc.invalidateQueries();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  async function remove(id: string) {
    try { await deleteRate(id); toast.success("Rate entry deleted"); await qc.invalidateQueries(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  }

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{c.name} {!c.is_active && <Badge variant="outline">Hidden from customers</Badge>}</h3>
          <p className="text-sm">Current: <strong>{current ? `${formatINR(current.rate_per_unit)} / ${UNIT_LABELS[c.unit]}` : "No rate — not shown to customers"}</strong></p>
        </div>
        <div className="flex gap-2">
          <Input className="w-36" type="number" min="0" step="0.01" placeholder="New rate (₹)" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button size="sm" disabled={busy} onClick={save}>{current ? "Update" : "Add rate"}</Button>
        </div>
      </div>
      {c.scrap_rates.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-muted-foreground">Rate history ({c.scrap_rates.length})</summary>
          <ul className="mt-2 divide-y">
            {c.scrap_rates.map((r, i) => (
              <li key={r.id} className="flex items-center justify-between gap-2 py-1.5">
                <span>{new Date(r.effective_from).toLocaleString("en-IN")} {i === 0 && <Badge variant="secondary">Live</Badge>}</span>
                <span className="flex items-center gap-2">
                  {formatINR(r.rate_per_unit)}
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="h-7 text-destructive">Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this rate entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {i === 0
                            ? c.scrap_rates.length > 1
                              ? "This is the live rate. The previous rate will become live again."
                              : "This is the only rate. The category will disappear from the customer website until you add a new rate."
                            : "This removes an old entry from the history."} Past orders are not affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep</AlertDialogCancel>
                        <AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
