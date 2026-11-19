import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, StateMessage } from "@/components/site-layout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currentRatesQuery } from "@/lib/api/catalog";
import { formatINR, UNIT_LABELS } from "@/lib/domain/pickup";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Today's Scrap Rates — Suhani Traders" },
      { name: "description", content: "Current buying rates for scrap materials, updated regularly." },
      { property: "og:title", content: "Today's Scrap Rates — Suhani Traders" },
      { property: "og:description", content: "Current buying rates for scrap materials, updated regularly." },
    ],
  }),
  component: Rates,
});

function Rates() {
  const { data, isLoading, error } = useQuery(currentRatesQuery);
  return (
    <PageShell title="Scrap rates" subtitle="Indicative buying rates. Final price depends on actual weight and quality.">
      {isLoading && <StateMessage>Loading rates…</StateMessage>}
      {error && <StateMessage>Couldn't load rates. Please refresh.</StateMessage>}
      {data && (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.category_id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(r.rate_per_unit)} / {UNIT_LABELS[r.unit]}</TableCell>
                  <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                    {new Date(r.rate_updated_at).toLocaleDateString("en-IN")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
