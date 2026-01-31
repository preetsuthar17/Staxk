import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-semibold text-4xl">404</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Button variant="outline">
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
