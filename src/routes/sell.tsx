import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell, StateMessage } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currentRatesQuery } from "@/lib/api/catalog";
import { submitPickupRequest } from "@/lib/api/pickups";
import { estimateTotal, formatINR, lineEstimate, MOBILE_RE, PINCODE_RE, UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Scrap — Book a Pickup | Suhani Traders" },
      { name: "description", content: "Select materials, get an instant estimate and book a doorstep scrap pickup." },
      { property: "og:title", content: "Sell Scrap — Book a Pickup | Suhani Traders" },
      { property: "og:description", content: "Select materials, get an instant estimate and book a doorstep scrap pickup." },
    ],
  }),
  component: Sell,
});

type Line = { key: number; categoryId: string; quantity: string };

function Sell() {
  const { data: rates, isLoading, error } = useQuery(currentRatesQuery);
  const [lines, setLines] = useState<Line[]>([{ key: 1, categoryId: "", quantity: "" }]);
  const [form, setForm] = useState({ name: "", mobile: "", address: "", pincode: "", date: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ requestCode: string; estimatedTotal: number } | null>(null);

  const rateById = useMemo(() => new Map((rates ?? []).map((r) => [r.category_id, r])), [rates]);
  const priced = lines.map((l) => {
    const r = rateById.get(l.categoryId);
    const q = Number(l.quantity);
    return { ...l, rate: r, est: r ? lineEstimate(q, r.rate_per_unit) : 0 };
  });
  const total = estimateTotal(priced.filter((p) => p.rate).map((p) => ({ quantity: Number(p.quantity), rate: p.rate!.rate_per_unit })));
  const today = new Date().toISOString().slice(0, 10);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const items = priced.filter((p) => p.rate && Number(p.quantity) > 0);
    if (items.length === 0) return void toast.error("Add at least one material with a quantity.");
    if (form.name.trim().length < 2) return void toast.error("Enter your name.");
    if (!MOBILE_RE.test(form.mobile)) return void toast.error("Enter a valid 10-digit mobile number.");
    if (form.address.trim().length < 5) return void toast.error("Enter your pickup address.");
    if (!PINCODE_RE.test(form.pincode)) return void toast.error("Enter a valid 6-digit pincode.");
    setSubmitting(true);
    try {
      const res = await submitPickupRequest({
        name: form.name,
        mobile: form.mobile,
        address: form.address,
        pincode: form.pincode,
        preferredDate: form.date || null,
        notes: form.notes,
        items: items.map((i) => ({ category_id: i.categoryId, quantity: Number(i.quantity) })),
      });
      setDone(res);
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <PageShell title="Pickup requested">
        <div className="max-w-lg rounded-xl border bg-card p-8">
          <CheckCircle2 className="h-10 w-10 text-success" />
          <p className="mt-4 text-sm text-muted-foreground">Your request ID</p>
          <p className="font-display text-3xl font-bold">{done.requestCode}</p>
          <p className="mt-4">Provisional estimate: <strong>{formatINR(done.estimatedTotal)}</strong></p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is an estimate. The final amount is set after weighing and quality check at pickup. We'll call you to confirm.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={() => { setDone(null); setLines([{ key: Date.now(), categoryId: "", quantity: "" }]); }}>New request</Button>
            <Button asChild variant="outline"><Link to="/rates">View rates</Link></Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Sell your scrap" subtitle="Tell us what you have. You'll get a request ID and a provisional estimate.">
      {isLoading && <StateMessage>Loading materials…</StateMessage>}
      {error && <StateMessage>Couldn't load materials. Please refresh.</StateMessage>}
      {rates && (
        <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <section className="rounded-lg border bg-card p-5">
              <h2 className="font-semibold">1. Materials</h2>
              <div className="mt-4 space-y-3">
                {priced.map((l, idx) => (
                  <div key={l.key} className="grid grid-cols-[1fr_110px_auto] items-end gap-2">
                    <div>
                      {idx === 0 && <Label className="mb-1 block text-xs">Material</Label>}
                      <select
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                        value={l.categoryId}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, categoryId: e.target.value } : x)))}
                      >
                        <option value="">Select…</option>
                        {rates.map((r) => (
                          <option key={r.category_id} value={r.category_id}>
                            {r.name} — {formatINR(r.rate_per_unit)}/{UNIT_LABELS[r.unit]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {idx === 0 && <Label className="mb-1 block text-xs">Approx. qty {l.rate ? `(${UNIT_LABELS[l.rate.unit]})` : ""}</Label>}
                      <Input type="number" min="0" step="0.1" value={l.quantity}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, quantity: e.target.value } : x)))} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove material" disabled={lines.length === 1}
                      onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4"
                onClick={() => setLines((ls) => [...ls, { key: Date.now(), categoryId: "", quantity: "" }])}>
                <Plus className="h-4 w-4" /> Add material
              </Button>
            </section>

            <section className="grid gap-4 rounded-lg border bg-card p-5 sm:grid-cols-2">
              <h2 className="font-semibold sm:col-span-2">2. Pickup details</h2>
              <Field label="Full name"><Input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <Field label="Mobile number"><Input inputMode="numeric" maxLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field label="Address" className="sm:col-span-2"><Textarea value={form.address} maxLength={500} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
              <Field label="Pincode"><Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field label="Preferred date (optional)"><Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <Field label="Notes (optional)" className="sm:col-span-2"><Textarea value={form.notes} maxLength={1000} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            </section>
          </div>

          <aside className="h-fit rounded-lg border bg-card p-5 lg:sticky lg:top-20">
            <h2 className="font-semibold">Estimate</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {priced.filter((p) => p.rate && p.est > 0).map((p) => (
                <li key={p.key} className="flex justify-between"><span>{p.rate!.name} × {p.quantity}</span><span>{formatINR(p.est)}</span></li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t pt-3 font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
            <p className="mt-3 text-xs text-muted-foreground">Provisional. Final price after weighing and quality check.</p>
            <Button type="submit" className="mt-5 w-full" disabled={submitting}>{submitting ? "Submitting…" : "Request pickup"}</Button>
          </aside>
        </form>
      )}
    </PageShell>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      {children}
    </div>
  );
}
