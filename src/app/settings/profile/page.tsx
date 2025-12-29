import { ProfileSettings } from "@/components/settings/user-settings/profile-settings/profile-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSession } from "@/lib/auth-utils";

export default async function ProfilePage() {
  await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl p-6">
          <ProfileSettings />
        </div>
      </main>
    </div>
  );
}
