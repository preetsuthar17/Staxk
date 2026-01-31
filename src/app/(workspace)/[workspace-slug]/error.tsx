"use client";

import { Button } from "@/components/ui/button";

export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-semibold text-2xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error occurred in this workspace.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
