import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, ClipboardList, Scale, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currentRatesQuery } from "@/lib/api/catalog";
import { formatINR, UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Suhani Traders — Sell Scrap From Home" },
      { name: "description", content: "Check today's scrap rates and book a free doorstep pickup in minutes." },
      { property: "og:title", content: "Suhani Traders — Sell Scrap From Home" },
      { property: "og:description", content: "Check today's scrap rates and book a free doorstep pickup in minutes." },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: ClipboardList, title: "Pick materials", text: "Choose what you want to sell and enter rough quantities." },
  { icon: CalendarCheck, title: "Book a pickup", text: "Get a request ID and a provisional estimate instantly." },
  { icon: Truck, title: "We come to you", text: "Our team confirms and arrives at your address." },
  { icon: Scale, title: "Weigh & get paid", text: "Final price after weighing and quality check." },
];

function Home() {
  const { data: rates } = useQuery(currentRatesQuery);
  return (
    <main>
      <section className="border-b bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Doorstep scrap pickup</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">Turn your scrap into cash, without leaving home.</h1>
            <p className="mt-4 text-lg text-muted-foreground">Transparent rates, honest weighing, and pickup at your doorstep.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/sell">Book a pickup</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/rates">See today's rates</Link></Button>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Today's rates</h2>
            <ul className="mt-4 divide-y">
              {(rates ?? []).slice(0, 5).map((r) => (
                <li key={r.category_id} className="flex justify-between py-2 text-sm">
                  <span>{r.name}</span>
                  <span className="font-semibold">{formatINR(r.rate_per_unit)} / {UNIT_LABELS[r.unit]}</span>
                </li>
              ))}
              {!rates && <li className="py-2 text-sm text-muted-foreground">Loading rates…</li>}
            </ul>
            <Link to="/rates" className="mt-4 inline-block text-sm font-medium text-primary">All rates →</Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-lg border bg-card p-5">
              <s.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{i + 1}. {s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
