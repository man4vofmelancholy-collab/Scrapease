import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageShell } from "@/components/site-layout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ScrapEase" },
      { name: "description", content: "Get in touch with ScrapEase for scrap pickup queries." },
      { property: "og:title", content: "Contact — ScrapEase" },
      { property: "og:description", content: "Get in touch with ScrapEase for scrap pickup queries." },
    ],
  }),
  component: Contact,
});

// Placeholder contact details — replace with real business details.
const ITEMS = [
  { icon: Phone, label: "Phone / WhatsApp", value: "+91 90000 00000" },
  { icon: Mail, label: "Email", value: "hello@scrapease.example" },
  { icon: MapPin, label: "Service area", value: "Your city (to be confirmed)" },
];

function Contact() {
  return (
    <PageShell title="Contact us" subtitle="Questions about rates or a pickup? Reach out.">
      <div className="grid gap-4 sm:grid-cols-3">
        {ITEMS.map((i) => (
          <div key={i.label} className="rounded-lg border bg-card p-5">
            <i.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">{i.label}</p>
            <p className="font-semibold">{i.value}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-muted-foreground">
        The fastest way to sell is to <Link to="/sell" className="font-medium text-primary">book a pickup online</Link>.
      </p>
    </PageShell>
  );
}
