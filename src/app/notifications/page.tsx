"use client";

import { IconInbox } from "@tabler/icons-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";
import { InvitationList } from "@/components/inbox/invitation-list";
import { Card, CardContent } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-4">
          <div className="flex w-full flex-col gap-6">
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h2 className="font-medium text-lg">Notifications</h2>
                  <p className="text-muted-foreground text-sm">
                    Your activity and system notifications
                  </p>
                </div>
                <Card>
                  <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
                    <IconInbox className="size-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      Your notifications inbox is empty
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
