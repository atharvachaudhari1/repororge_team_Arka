import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, SearchX } from "lucide-react";

export function JobCardSkeleton() {
  return (
    <div className="surface-card p-5" aria-hidden="true">
      <div className="skeleton-block h-5 w-2/3" />
      <div className="skeleton-block mt-3 h-4 w-1/2" />
      <div className="skeleton-block mt-4 h-6 w-28" />
      <div className="skeleton-block mt-4 h-16 w-full" />
    </div>
  );
}

export function ListSkeleton({ count = 3, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="mt-4 grid gap-4">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BlockSkeleton({ lines = 4, label = "Loading" }: { lines?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="surface-card p-5">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton-block h-4 ${i === 0 ? "w-1/3" : "mt-3 w-full"}`} />
      ))}
    </div>
  );
}

export function EmptyState({
  title, body, children,
}: { title: string; body: string; children?: ReactNode }) {
  return (
    <div className="surface-card mt-4 p-6 text-center">
      <SearchX aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
      <h3 className="mt-3 text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {children ? <div className="mt-4 flex flex-wrap justify-center gap-2">{children}</div> : null}
    </div>
  );
}

export function ErrorState({
  title, message, onRetry,
}: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="surface-card mt-4 border-warning/40 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <AlertTriangle aria-hidden="true" className="size-4 text-warning" />
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3 min-h-11" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
