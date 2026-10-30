import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/site-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ScrapEase" },
      { name: "description", content: "Sign in to track your scrap pickup requests." },
      { property: "og:title", content: "Sign in — ScrapEase" },
      { property: "og:description", content: "Sign in to track your scrap pickup requests." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/my-requests" });
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Password reset link sent.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) navigate({ to: "/my-requests" });
  }

  return (
    <PageShell title={mode === "up" ? "Create account" : mode === "forgot" ? "Reset password" : "Sign in"}>
      <div className="max-w-sm space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "up" && (<div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>)}
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          {mode !== "forgot" && (<div><Label>Password</Label><Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>)}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : mode === "up" ? "Sign up" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>
        {mode !== "forgot" && <Button variant="outline" className="w-full" onClick={google}>Continue with Google</Button>}
        <div className="flex justify-between text-sm">
          <button className="text-primary" onClick={() => setMode(mode === "up" ? "in" : "up")}>
            {mode === "up" ? "Have an account? Sign in" : "New here? Create account"}
          </button>
          {mode === "in" && <button className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>}
        </div>
        <p className="text-xs text-muted-foreground">You don't need an account to book a pickup. Sign in to see your request history.</p>
      </div>
    </PageShell>
  );
}
