import useSWR from "swr";
import type { WorkspaceMemberData } from "@/lib/member";

interface UseWorkspaceMembersResponse {
  members: WorkspaceMemberData[];
}

interface UseWorkspaceMembersOptions {
  initialData?: WorkspaceMemberData[];
}

export function useWorkspaceMembers(
  workspaceSlug: string,
  options?: UseWorkspaceMembersOptions
) {
  const { data, error, isLoading, mutate } =
    useSWR<UseWorkspaceMembersResponse>(
      `/api/workspace/${encodeURIComponent(workspaceSlug)}/members`,
      {
        fallbackData: options?.initialData
          ? { members: options.initialData }
          : undefined,
      }
    );

  return {
    members: data?.members ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
