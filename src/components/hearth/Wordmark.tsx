import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-medium tracking-tight text-foreground", className)}>
      <span aria-hidden className="h-2 w-2 rounded-full bg-primary" />
      Hearth
    </span>
  );
}
