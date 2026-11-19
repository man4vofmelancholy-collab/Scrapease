import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { PageShell, StateMessage } from "@/components/site-layout";
import { currentRatesQuery } from "@/lib/api/catalog";
import { UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Scrap Categories — Suhani Traders" },
      { name: "description", content: "Materials we buy: paper, metals, plastic, appliances and more." },
      { property: "og:title", content: "Scrap Categories — Suhani Traders" },
      { property: "og:description", content: "Materials we buy: paper, metals, plastic, appliances and more." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { data, isLoading, error } = useQuery(currentRatesQuery);
  return (
    <PageShell title="What we buy" subtitle="All materials currently accepted for pickup.">
      {isLoading && <StateMessage>Loading categories…</StateMessage>}
      {error && <StateMessage>Couldn't load categories. Please refresh.</StateMessage>}
      {data && data.length === 0 && <StateMessage>No categories available right now.</StateMessage>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <div key={c.category_id} className="rounded-lg border bg-card p-5">
            {c.image_url ? <img src={c.image_url} alt={c.name} loading="lazy" className="h-32 w-full rounded-md object-cover" /> : <Package className="h-5 w-5 text-primary" />}
            <h2 className="mt-2 text-lg font-semibold">{c.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
            <p className="mt-3 text-xs text-muted-foreground">Sold per {UNIT_LABELS[c.unit]}</p>
          </div>
        ))}
      </div>
      {data && data.length > 0 && (
        <Link to="/sell" className="mt-8 inline-block font-medium text-primary">Book a pickup →</Link>
      )}
    </PageShell>
  );
}
