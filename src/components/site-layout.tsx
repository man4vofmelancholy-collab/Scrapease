import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Recycle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/categories", label: "Categories" },
  { to: "/rates", label: "Rates" },
  { to: "/sell", label: "Sell Scrap" },
  { to: "/contact", label: "Contact" },
] as const;

const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/categories", label: "Categories", exact: false },
  { to: "/admin/rates", label: "Rates", exact: false },
  { to: "/admin/orders", label: "Orders Received", exact: false },
  { to: "/admin/enquiries", label: "Enquiries", exact: false },
] as const;

export function SiteHeader() {
  const { user, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const linkCls = "whitespace-nowrap text-muted-foreground hover:text-foreground";
  const active = { className: "text-foreground font-semibold" };
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2 font-display text-lg font-bold text-primary">
          <Recycle className="h-6 w-6" /> Suhani Traders
          {isAdmin && <span className="rounded bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">Admin</span>}
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm md:order-last md:ml-0">
          {user ? (
            <>
              {isAdmin ? (
                <Button asChild size="sm" variant="ghost"><Link to="/">View site</Link></Button>
              ) : (
                <Button asChild size="sm" variant="ghost"><Link to="/my-requests">My requests</Link></Button>
              )}
              <Button size="sm" variant="outline" onClick={signOut}>Sign out</Button>
            </>
          ) : (
            <Button asChild size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
        <nav className="order-last flex w-full gap-4 overflow-x-auto pb-1 text-sm md:order-none md:w-auto md:flex-1 md:pb-0">
          {isAdmin
            ? ADMIN_NAV.map((n) => (
                <Link key={n.to} to={n.to} activeOptions={{ exact: n.exact }} className={linkCls} activeProps={active}>{n.label}</Link>
              ))
            : NAV.map((n) => (
                <Link key={n.to} to={n.to} className={linkCls} activeProps={active}>{n.label}</Link>
              ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-secondary/50">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
        © {new Date().getFullYear()} Suhani Traders · Doorstep scrap pickup. Rates are indicative; final price after weighing.
      </div>
    </footer>
  );
}

export function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function StateMessage({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">{children}</div>;
}
