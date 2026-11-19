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
import { Textarea } from "@/components/ui/textarea";
import { deleteEnquiry, enquiriesQuery, updateEnquiry, type Enquiry } from "@/lib/api/admin";
import { ENQUIRY_LABELS, type EnquiryStatus } from "@/lib/domain/admin";

export const Route = createFileRoute("/_authenticated/admin/enquiries")({
  head: () => ({ meta: [{ title: "Enquiries — Suhani Traders Admin" }, { name: "robots", content: "noindex" }] }),
  component: Enquiries,
});

const FILTERS: (EnquiryStatus | "all")[] = ["all", "new", "in_progress", "resolved"];

function Enquiries() {
  const [status, setStatus] = useState<EnquiryStatus | "all">("all");
  const { data, isLoading, error } = useQuery(enquiriesQuery);
  const rows = (data ?? []).filter((e) => status === "all" || e.status === status);
  return (
    <div>
      <h1 className="text-2xl font-bold">Contact enquiries</h1>
      <p className="mt-1 text-sm text-muted-foreground">Messages sent from the Contact page. Reply by phone or email, then mark them resolved.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button key={f} size="sm" variant={status === f ? "default" : "outline"} onClick={() => setStatus(f)}>
            {f === "all" ? "All" : ENQUIRY_LABELS[f]}
            {data && <span className="ml-1 opacity-70">({f === "all" ? data.length : data.filter((e) => e.status === f).length})</span>}
          </Button>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {isLoading && <StateMessage>Loading…</StateMessage>}
        {error && <StateMessage>Couldn't load enquiries.</StateMessage>}
        {data && rows.length === 0 && <StateMessage>No enquiries here.</StateMessage>}
        {rows.map((e) => <EnquiryCard key={e.id} e={e} />)}
      </div>
    </div>
  );
}

function EnquiryCard({ e }: { e: Enquiry }) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState(e.admin_notes ?? "");
  const [busy, setBusy] = useState(false);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["admin-enquiries"] }), qc.invalidateQueries({ queryKey: ["admin-dashboard"] })]);
  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try { await fn(); toast.success(ok); await refresh(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    finally { setBusy(false); }
  }
  return (
    <div className="rounded-lg border bg-card p-5 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{e.name}</h3>
          <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("en-IN")}</p>
        </div>
        <Badge variant={e.status === "new" ? "default" : "secondary"}>{ENQUIRY_LABELS[e.status]}</Badge>
      </div>
      <div className="mt-2 space-x-3">
        {e.phone && <a className="text-primary" href={`tel:${e.phone}`}>{e.phone}</a>}
        {e.email && <a className="text-primary" href={`mailto:${e.email}?subject=${encodeURIComponent("Re: your Suhani Traders enquiry")}`}>{e.email}</a>}
      </div>
      <p className="mt-3 whitespace-pre-wrap">{e.message}</p>
      <Textarea className="mt-3" rows={2} maxLength={2000} placeholder="Internal notes (only admins see this)" value={notes} onChange={(ev) => setNotes(ev.target.value)} />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => updateEnquiry(e.id, { admin_notes: notes.trim() || null }), "Notes saved")}>Save notes</Button>
        {(["new", "in_progress", "resolved"] as const).filter((s) => s !== e.status).map((s) => (
          <Button key={s} size="sm" variant="outline" disabled={busy} onClick={() => run(() => updateEnquiry(e.id, { status: s }), `Marked ${ENQUIRY_LABELS[s]}`)}>
            Mark {ENQUIRY_LABELS[s]}
          </Button>
        ))}
        <AlertDialog>
          <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive" disabled={busy}>Delete</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this enquiry?</AlertDialogTitle>
              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={() => run(() => deleteEnquiry(e.id), "Enquiry deleted")}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
