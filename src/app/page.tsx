import { DashboardSidebar } from "@/components/dashboard/sidebar/sidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSession } from "@/lib/auth-utils";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DashboardSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {session.user.name}</CardTitle>
              <CardDescription>You are now signed in.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Start building your project management dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
