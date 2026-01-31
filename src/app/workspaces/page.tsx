import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspace";
import { WorkspacesClient } from "./workspaces-client";

export default async function WorkspacesPage() {
  const headersList = await headers();

  const sessionData = await auth.api.getSession({ headers: headersList });
  if (!sessionData?.user) {
    redirect("/login");
  }

  const workspaces = await getUserWorkspaces(sessionData.user.id);

  return <WorkspacesClient workspaces={workspaces} />;
}
