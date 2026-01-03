"use client";

import { IconArrowRight, IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: "owner" | "admin" | "member";
}

function WorkspaceCardSkeleton({
  isFirst,
  isLast,
}: {
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Card
      className={[
        "flex flex-row justify-between rounded-none border-b border-b-foreground/10 py-2",
        isFirst && "rounded-t-lg",
        isLast && "rounded-b-lg border-b-0",
        !isLast && "border-b-0",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CardHeader className="px-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        <Skeleton className="size-8 rounded-md" />
      </CardContent>
    </Card>
  );
}

export default function WorkspacesPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isSessionPending) {
      return;
    }

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        const response = await fetch("/api/workspace/list");
        if (response.ok) {
          const data = await response.json();
          setWorkspaces(data.workspaces || []);
        }
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaces();
  }, [session, isSessionPending, router]);

  const handleWorkspaceSelect = (slug: string) => {
    router.push(`/${slug}`);
  };

  if (isSessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  let workspaceContent: ReactNode = null;
  if (isLoading) {
    workspaceContent = (
      <>
        <WorkspaceCardSkeleton isFirst={true} isLast={false} />
        <WorkspaceCardSkeleton isFirst={false} isLast={false} />
        <WorkspaceCardSkeleton isFirst={false} isLast={true} />
      </>
    );
  } else if (workspaces.length === 0) {
    workspaceContent = (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No workspaces</CardTitle>
          <CardDescription>
            You don't have any workspaces yet. Create one to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => router.push("/onboarding")}>
            Create Workspace
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    workspaceContent = workspaces.map((workspace, idx) => {
      const isFirst = idx === 0;
      const isLast = idx === workspaces.length - 1;
      return (
        <Card
          className={[
            "flex cursor-pointer flex-row justify-between rounded-none border-b border-b-foreground/10 py-2 transition-colors hover:bg-accent",
            isFirst && "rounded-t-lg",
            isLast && "rounded-b-lg border-b-0",
            !isLast && "border-b-0",
          ]
            .filter(Boolean)
            .join(" ")}
          key={workspace.id}
          onClick={() => handleWorkspaceSelect(workspace.slug)}
        >
          <CardHeader className="px-2">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                <IconBuilding className="size-4 text-primary" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <CardTitle className="font-[490] text-base">
                  {workspace.name}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2">
            <Button size="icon-sm" variant="outline">
              <IconArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      );
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="flex w-full max-w-xs flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-medium text-xl">Select a workspace</h1>
        </div>
        <div className="flex flex-col">{workspaceContent}</div>
      </div>
    </div>
  );
}
