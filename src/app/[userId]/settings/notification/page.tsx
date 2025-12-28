import { NotificationSettings } from "@/components/settings/user-settings/notification-settings/notification-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSessionForUser } from "@/lib/auth-utils";

interface NotificationPageProps {
  params: Promise<{ userId: string }>;
}

export default async function NotificationPage({
  params,
}: NotificationPageProps) {
  const { userId } = await params;
  await requireSessionForUser(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <NotificationSettings />
        </div>
      </main>
    </div>
  );
}
