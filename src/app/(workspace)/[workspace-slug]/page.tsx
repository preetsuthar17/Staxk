import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getWorkspaceBySlug } from "@/lib/workspace";

interface WorkspacePageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { "workspace-slug": slug } = await params;

  const headersList = await headers();
  const sessionData = await auth.api.getSession({
    headers: headersList,
  });

  if (!sessionData?.user) {
    redirect("/login");
  }

  const userId = sessionData.user.id;
  const workspace = await getWorkspaceBySlug(slug, userId);

  if (!workspace) {
    redirect("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-3xl">{workspace.name}</h1>
        {workspace.description && (
          <p className="text-lg text-muted-foreground">
            {workspace.description}
          </p>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your workspace</CardTitle>
          <CardDescription>
            This is your workspace dashboard. More features coming soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your workspace is ready to use. Start building your projects here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
