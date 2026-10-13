import { createFileRoute, Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/hearth/Wordmark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hearth — AI workspace prototype" },
      { name: "description", content: "A minimal AI workspace with model routing, memory, tasks and a creation studio. Web prototype." },
      { property: "og:title", content: "Hearth — AI workspace prototype" },
      { property: "og:description", content: "A minimal AI workspace with model routing, memory, tasks and a creation studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen flex-col bg-background px-6">
      <header className="flex h-14 items-center justify-between">
        <Wordmark />
        <Link to="/auth" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Sign in
        </Link>
      </header>
      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 pb-24">
        <h1 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
          A quiet workspace for thinking with AI.
        </h1>
        <p className="text-muted-foreground">
          Conversations, memory, tasks and a creation studio in one place. This is an early web prototype; the
          desktop app for Windows and macOS comes later.
        </p>
        <div>
          <Button asChild>
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
