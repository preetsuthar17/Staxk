import { SecuritySettings } from "@/components/settings/user-settings/security-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { requireSessionForUser } from "@/lib/auth-utils";

interface SecurityPageProps {
  params: Promise<{ userId: string }>;
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  const { userId } = await params;
  await requireSessionForUser(userId);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SettingsSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <SecuritySettings />
        </div>
      </main>
    </div>
  );
}
