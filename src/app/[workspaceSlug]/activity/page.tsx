"use client";

import { IconActivity } from "@tabler/icons-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WorkspaceActivityPage() {
  return (
    <div className="w-full p-4">
      <div className="flex w-full flex-col gap-6">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="font-medium text-lg">Activity</h2>
              <p className="text-muted-foreground text-sm">
                Workspace activity and system notifications
              </p>
            </div>
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                <IconActivity className="size-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Your workspace activity is empty
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
