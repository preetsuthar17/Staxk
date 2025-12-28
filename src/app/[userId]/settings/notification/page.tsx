import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NotificationSettings } from "@/components/settings/user-settings/notification-settings";
import { SettingsSidebar } from "@/components/settings/user-settings/settings-sidebar";
import { auth } from "@/lib/auth";

interface NotificationPageProps {
  params: Promise<{ userId: string }>;
}

export default async function NotificationPage({
  params,
}: NotificationPageProps) {
  const { userId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/home");
  }

  if (session.user.id !== userId) {
    notFound();
  }

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
