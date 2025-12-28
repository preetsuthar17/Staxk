import { ProfileSettings } from "@/components/settings/user-settings/profile-settings/profile-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSessionForUser } from "@/lib/auth-utils";

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params;
  await requireSessionForUser(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <ProfileSettings />
        </div>
      </main>
    </div>
  );
}
