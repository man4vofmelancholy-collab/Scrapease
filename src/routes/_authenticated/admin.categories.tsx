import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StateMessage } from "@/components/site-layout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { deleteCategory } from "@/lib/api/admin";
import { addRate, adminCategoriesQuery, saveCategory, type AdminCategory } from "@/lib/api/catalog";
import { validateRate } from "@/lib/domain/admin";
import { formatINR, UNIT_LABELS, type ScrapUnit } from "@/lib/domain/pickup";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — ScrapEase Admin" }, { name: "robots", content: "noindex" }] }),
  component: Categories,
});

function Categories() {
  const { data, isLoading, error } = useQuery(adminCategoriesQuery);
  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">Materials you buy. Inactive categories are hidden from customers.</p>
      <div className="mt-6"><CategoryForm /></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {isLoading && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage>Couldn't load categories.</StateMessage>}
        {data?.length === 0 && <StateMessage>No categories yet.</StateMessage>}
        {data?.map((c) => <CategoryCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function CategoryForm({ c, onDone }: { c?: AdminCategory; onDone?: () => void }) {
  const qc = useQueryClient();
  const empty = { name: "", description: "", unit: "kg" as ScrapUnit, sort_order: 0, is_active: true, image_url: "", rate: "" };
  const [f, setF] = useState(c ? { name: c.name, description: c.description ?? "", unit: c.unit, sort_order: c.sort_order, is_active: c.is_active, image_url: c.image_url ?? "", rate: "" } : empty);
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (f.name.trim().length < 2 || f.name.trim().length > 80) return void toast.error("Name must be 2–80 characters");
    if (f.image_url.trim() && !/^https:\/\//i.test(f.image_url.trim())) return void toast.error("Image link must start with https://");
    const rate = c ? null : validateRate(f.rate);
    if (!c && rate === null) return void toast.error("Enter a starting rate above 0");
    setBusy(true);
    try {
      const id = await saveCategory({ id: c?.id, ...f });
      if (!c && rate !== null) {
        const { data } = await supabase.auth.getUser();
        await addRate(id, rate, data.user!.id);
        setF(empty);
      }
      toast.success(c ? "Category updated" : "Category added");
      await qc.invalidateQueries();
      onDone?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg.includes("duplicate") ? "A category with this name already exists" : msg);
    } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="grid gap-3 rounded-lg border bg-card p-5 sm:grid-cols-6">
      <h2 className="font-semibold sm:col-span-6">{c ? `Edit ${c.name}` : "Add category"}</h2>
      <div className="sm:col-span-2"><Label>Name</Label><Input value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="sm:col-span-4"><Label>Description</Label><Input value={f.description} maxLength={300} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
      <div className="sm:col-span-4"><Label>Image link (optional)</Label><Input placeholder="https://…" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></div>
      <div><Label>Unit</Label>
        <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as ScrapUnit })}>
          {Object.keys(UNIT_LABELS).map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>
      <div><Label>Display order</Label><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) || 0 })} /></div>
      {!c && <div className="sm:col-span-2"><Label>Starting rate (₹)</Label><Input type="number" min="0" step="0.01" value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></div>}
      <div className="flex items-end gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><span className="text-sm">Active</span></div>
      <div className="flex items-end gap-2">
        <Button type="submit" size="sm" disabled={busy}>{c ? "Save" : "Add"}</Button>
        {onDone && <Button type="button" size="sm" variant="ghost" onClick={onDone}>Cancel</Button>}
      </div>
    </form>
  );
}

function CategoryCard({ c }: { c: AdminCategory }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const current = c.scrap_rates[0];
  async function remove() {
    try {
      const r = await deleteCategory(c.id);
      toast.success(r === "deleted" ? "Category deleted" : "This category has past orders, so it was made inactive instead of deleted");
      await qc.invalidateQueries();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Delete failed"); }
  }
  if (editing) return <div className="md:col-span-2"><CategoryForm c={c} onDone={() => setEditing(false)} /></div>;
  return (
    <div className="flex gap-4 rounded-lg border bg-card p-5">
      {c.image_url && <img src={c.image_url} alt={c.name} className="h-20 w-20 shrink-0 rounded-md object-cover" />}
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold">{c.name} {!c.is_active && <Badge variant="outline">Inactive</Badge>}</h3>
        <p className="text-sm text-muted-foreground">{c.description}</p>
        <p className="mt-2 text-sm">Current rate: <strong>{current ? `${formatINR(current.rate_per_unit)} / ${UNIT_LABELS[c.unit]}` : "None"}</strong> · Order {c.sort_order}</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive">Delete</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the category and its rate history. If any customer order includes it, it will be made inactive instead so order history stays intact.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
