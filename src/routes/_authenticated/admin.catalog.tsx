import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StateMessage } from "@/components/site-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { addRate, adminCategoriesQuery, saveCategory, type AdminCategory } from "@/lib/api/catalog";
import { formatINR, UNIT_LABELS, type ScrapUnit } from "@/lib/domain/pickup";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  component: Catalog,
});

function Catalog() {
  const { data, isLoading, error } = useQuery(adminCategoriesQuery);
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories & rates</h1>
      <p className="mt-1 text-sm text-muted-foreground">Rate changes are saved as new entries, so history is kept.</p>
      <div className="mt-6"><CategoryForm /></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {isLoading && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage>Couldn't load categories.</StateMessage>}
        {data?.map((c) => <CategoryCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function CategoryForm({ c, onDone }: { c?: AdminCategory; onDone?: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: c?.name ?? "", description: c?.description ?? "", unit: (c?.unit ?? "kg") as ScrapUnit,
    sort_order: c?.sort_order ?? 0, is_active: c?.is_active ?? true, rate: "",
  });
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2) return toast.error("Name is too short");
    if (!c && !(Number(f.rate) > 0)) return toast.error("Enter a starting rate");
    setBusy(true);
    try {
      const id = await saveCategory({ id: c?.id, ...f });
      if (!c) {
        const { data } = await (await import("@/integrations/supabase/client")).supabase.auth.getUser();
        await addRate(id, Number(f.rate), data.user!.id);
        setF({ ...f, name: "", description: "", rate: "" });
      }
      toast.success(c ? "Category updated" : "Category added");
      await qc.invalidateQueries();
      onDone?.();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Save failed"); }
    finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-6">
      {!c && <h2 className="font-semibold sm:col-span-6">Add category</h2>}
      <div className="sm:col-span-2"><Label>Name</Label><Input value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="sm:col-span-4"><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div><Label>Unit</Label>
        <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as ScrapUnit })}>
          {Object.keys(UNIT_LABELS).map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div><Label>Order</Label><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></div>
      {!c && <div className="sm:col-span-2"><Label>Starting rate (₹)</Label><Input type="number" min="0" step="0.01" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></div>}
      <div className="flex items-end gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active</span></div>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" disabled={busy}>{c ? "Save" : "Add"}</Button>
        {onDone && <Button type="button" size="sm" variant="ghost" onClick={onDone}>Close</Button>}
      </div>
    </form>
  );
}

function CategoryCard({ c }: { c: AdminCategory }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState("");
  const [busy, setBusy] = useState(false);
  const current = c.scrap_rates[0];
  async function updateRate() {
    const n = Number(rate);
    if (!(n > 0)) return toast.error("Enter a rate above 0");
    setBusy(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.auth.getUser();
      await addRate(c.id, n, data.user!.id);
      setRate("");
      toast.success("Rate updated");
      await qc.invalidateQueries();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  if (editing) return <div className="md:col-span-2"><CategoryForm c={c} onDone={() => setEditing(false)} /></div>;
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{c.name} {!c.is_active && <Badge variant="outline">Inactive</Badge>}</h3>
          <p className="text-sm text-muted-foreground">{c.description}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
      </div>
      <p className="mt-3 text-sm">Current: <strong>{current ? `${formatINR(current.rate_per_unit)} / ${UNIT_LABELS[c.unit]}` : "No rate"}</strong></p>
      <div className="mt-3 flex gap-2">
        <Input type="number" min="0" step="0.01" placeholder="New rate (₹)" value={rate} onChange={(e) => setRate(e.target.value)} />
        <Button size="sm" disabled={busy} onClick={updateRate}>Update</Button>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground">Rate history ({c.scrap_rates.length})</summary>
        <ul className="mt-2 space-y-1">
          {c.scrap_rates.map((r) => (
            <li key={r.id} className="flex justify-between"><span>{new Date(r.effective_from).toLocaleString("en-IN")}</span><span>{formatINR(r.rate_per_unit)}</span></li>
          ))}
        </ul>
      </details>
    </div>
  );
}
