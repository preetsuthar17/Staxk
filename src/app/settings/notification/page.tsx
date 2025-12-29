import { NotificationSettings } from "@/components/settings/user-settings/notification-settings/notification-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSession } from "@/lib/auth-utils";

export default async function NotificationPage() {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-6">
          <NotificationSettings />
        </div>
      </main>
    </div>
  );
}
