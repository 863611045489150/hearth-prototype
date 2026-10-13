import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Wordmark } from "@/components/hearth/Wordmark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Workspace — Hearth" },
      { name: "description", content: "Your Hearth workspace." },
      { property: "og:title", content: "Workspace — Hearth" },
      { property: "og:description", content: "Your Hearth workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AppShell,
});

function AppShell() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const provider = (user.app_metadata?.provider as string | undefined) ?? "email";

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="grid h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-4 sm:px-6">
        <Wordmark />
        <Button variant="ghost" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </header>
      <section className="mx-auto w-full max-w-xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-xl font-medium tracking-tight">Account</h1>
        <dl className="mt-6 divide-y divide-border rounded-md border border-border text-sm">
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-4 py-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate" data-testid="account-email">{user.email}</dd>
          </div>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 px-4 py-3">
            <dt className="text-muted-foreground">Signed in with</dt>
            <dd className="capitalize">{provider}</dd>
          </div>
        </dl>
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Web prototype: your data is stored in Hearth's cloud database, not on this device. The future desktop app
          will keep memory in a local memory.md file and history in on-device SQLite.
        </p>
      </section>
    </main>
  );
}
