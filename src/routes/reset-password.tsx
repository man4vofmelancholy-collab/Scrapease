import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — ScrapEase" },
      { name: "description", content: "Choose a new password for your ScrapEase account." },
      { property: "og:title", content: "Set new password — ScrapEase" },
      { property: "og:description", content: "Choose a new password for your ScrapEase account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/my-requests" });
  }
  return (
    <PageShell title="Set a new password">
      <form onSubmit={onSubmit} className="max-w-sm space-y-3">
        <Input type="password" minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" required />
        <Button type="submit">Update password</Button>
      </form>
    </PageShell>
  );
}
