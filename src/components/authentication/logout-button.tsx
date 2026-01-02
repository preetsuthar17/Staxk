import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface LogoutButtonProps {
  className?: string;
}

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <Button className={cn("h-fit w-fit p-0", className)} variant="destructive">
      <Link
        className="flex h-10 items-center justify-center px-3.5"
        href={"/logout"}
      >
        Log out
      </Link>
    </Button>
  );
}
