import { redirect } from "next/navigation";

interface TeamPageProps {
  params: Promise<{ "workspace-slug": string; "team-identifier": string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
  const { "workspace-slug": workspaceSlug, "team-identifier": teamIdentifier } =
    await params;

  redirect(`/${workspaceSlug}/teams/${teamIdentifier}/issues`);
}
