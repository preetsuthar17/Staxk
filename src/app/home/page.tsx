"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleWorkspaceClick = () => {
    router.push("/");
  };

  const handleSignInClick = () => {
    router.push("/login");
  };

  const handleSignUpClick = () => {
    router.push("/signup");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex gap-2">
        {session ? (
          <Button onClick={handleWorkspaceClick}>Go to your workspace</Button>
        ) : (
          <>
            <Button onClick={handleSignInClick}>Sign in</Button>
            <Button onClick={handleSignUpClick} variant="outline">
              Sign up
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
