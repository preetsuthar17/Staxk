import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWorkspaceProjects } from "@/lib/project";
import { getWorkspaceBySlug } from "@/lib/workspace";
import { ProjectsClient } from "./projects-client";

interface ProjectsPageProps {
  params: Promise<{ "workspace-slug": string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { "workspace-slug": workspaceSlug } = await params;
  const headersList = await headers();

  const sessionData = await auth.api.getSession({ headers: headersList });
  if (!sessionData?.user) {
    redirect("/login");
  }

  const workspace = await getWorkspaceBySlug(
    workspaceSlug,
    sessionData.user.id
  );
  if (!workspace) {
    redirect("/");
  }

  const projects = await getWorkspaceProjects(workspace.id);

  return (
    <ProjectsClient initialProjects={projects} workspaceSlug={workspaceSlug} />
  );
}
