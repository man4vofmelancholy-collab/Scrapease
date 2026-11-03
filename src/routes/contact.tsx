import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry } from "@/lib/api/admin";
import { validateEnquiry } from "@/lib/domain/admin";

function EnquiryForm() {
  const empty = { name: "", email: "", phone: "", message: "" };
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const err = validateEnquiry(f);
    if (err) return void toast.error(err);
    setBusy(true);
    try { await submitEnquiry(f); setF(empty); setSent(true); }
    catch { toast.error("Couldn't send your message. Please try again."); }
    finally { setBusy(false); }
  }
  if (sent) return (
    <div className="mt-10 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">Thanks — message received</h2>
      <p className="mt-1 text-sm text-muted-foreground">We'll get back to you soon.</p>
      <Button className="mt-4" size="sm" variant="outline" onClick={() => setSent(false)}>Send another</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="mt-10 grid max-w-2xl gap-4 rounded-lg border bg-card p-6 sm:grid-cols-2">
      <h2 className="text-lg font-semibold sm:col-span-2">Send us a message</h2>
      <div className="sm:col-span-2"><Label htmlFor="cn">Name</Label><Input id="cn" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div><Label htmlFor="ce">Email</Label><Input id="ce" type="email" maxLength={255} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      <div><Label htmlFor="cp">Phone</Label><Input id="cp" type="tel" maxLength={15} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
      <div className="sm:col-span-2"><Label htmlFor="cm">Message</Label><Textarea id="cm" rows={4} maxLength={2000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></div>
      <div className="sm:col-span-2"><Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"}</Button></div>
    </form>
  );
}

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
