"use client";

import { IconArrowRight, IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkspaceData } from "@/lib/workspace";

interface WorkspacesClientProps {
  workspaces: WorkspaceData[];
}

export function WorkspacesClient({ workspaces }: WorkspacesClientProps) {
  const router = useRouter();

  const handleWorkspaceSelect = (slug: string) => {
    router.push(`/${slug}`);
  };

  if (workspaces.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 font-sans">
        <div className="flex w-full max-w-xs flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-medium text-xl">Select a workspace</h1>
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>No workspaces</CardTitle>
              <CardDescription>
                You don't have any workspaces yet. Create one to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => router.push("/onboarding")}
              >
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 font-sans">
      <div className="flex w-full max-w-xs flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="font-medium text-xl">Select a workspace</h1>
        </div>
        <div className="flex flex-col">
          {workspaces.map((workspace, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === workspaces.length - 1;
            return (
              <Card
                className={[
                  "flex flex-row items-center justify-between rounded-none border-b border-b-foreground/10 py-2 transition-colors hover:bg-accent",
                  isFirst && "rounded-t-lg",
                  isLast && "rounded-b-lg border-b-0",
                  !isLast && "border-b-0",
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={workspace.id}
                onClick={() => handleWorkspaceSelect(workspace.slug)}
              >
                <CardHeader className="items-center px-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-7 shrink-0 rounded-full border bg-primary/10">
                      {workspace.logo ? (
                        <AvatarImage
                          alt={`${workspace.name} logo`}
                          className="rounded-full"
                          src={workspace.logo}
                        />
                      ) : (
                        <AvatarFallback className="rounded-full bg-primary/10 text-primary">
                          <IconBuilding aria-hidden="true" className="size-4" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex flex-1 flex-col gap-1">
                      <CardTitle className="font-[490] text-sm">
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
          })}
        </div>
      </div>
    </div>
  );
}
