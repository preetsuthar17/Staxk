"use client";

import { IconLogout, IconSettings } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!(isPending || session?.user)) {
      router.replace("/login");
    }
  }, [session, isPending, router]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      toast.error("Error during logout");
      setIsLoggingOut(false);
    }
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              {user.image && (
                <AvatarImage alt={user.name || "User"} src={user.image} />
              )}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-base">{user.name || "User"}</p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {user.username && (
                <p className="text-muted-foreground text-sm">
                  @{user.username}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                Email Verified
              </span>
              <span className="font-medium text-sm">
                {user.emailVerified ? "Yes" : "No"}
              </span>
            </div>
            {session.session?.createdAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Session Started
                </span>
                <span className="font-medium text-sm">
                  {new Date(session.session.createdAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleSettings}
              aria-label="Settings"
            >
              <IconSettings className="size-4" />
              Settings
            </Button>
            <Button
              className="w-full"
              disabled={isLoggingOut}
              loading={isLoggingOut}
              onClick={handleLogout}
              variant="outline"
            >
              <IconLogout className="size-4" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
