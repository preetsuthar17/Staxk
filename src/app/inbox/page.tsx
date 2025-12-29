"use client";

import { Inbox as InboxIcon } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";
import { InvitationList } from "@/components/inbox/invitation-list";
import { Card, CardContent } from "@/components/ui/card";

export default function InboxPage() {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container px-4 py-8">
          <div className="flex flex-col gap-6">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="font-medium text-lg">Inbox</h2>
                  <p className="text-muted-foreground text-sm">
                    Your activity and system notifications
                  </p>
                </div>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <InboxIcon className="mb-3 size-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Your Inbox is empty
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      You'll see notifications here when there's activity
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="font-medium text-lg">Workspace Invitations</h2>
                  <p className="text-muted-foreground text-sm">
                    Accept or decline invitations to join workspaces
                  </p>
                </div>
                <InvitationList />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
