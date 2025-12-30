import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-9xl text-foreground tracking-tighter">
            404
          </h1>
          <h2 className="font-medium text-2xl text-foreground">
            Page Not Found
          </h2>
          <p className="text-muted-foreground text-sm">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button>
            <Link href="/">Go Home</Link>
          </Button>
          <Button variant="outline">
            <Link href="/home">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
