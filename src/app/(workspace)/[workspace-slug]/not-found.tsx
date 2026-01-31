import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-semibold text-2xl">Workspace not found</h1>
      <p className="text-muted-foreground">
        The workspace you're looking for doesn't exist or you don't have access.
      </p>
      <Button variant="outline">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
