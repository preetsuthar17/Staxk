import useSWR from "swr";
import type { InvitationData } from "@/lib/invitation";

interface UseWorkspaceInvitationsResponse {
  invitations: InvitationData[];
}

export function useWorkspaceInvitations(workspaceSlug: string) {
  const { data, error, isLoading, mutate } =
    useSWR<UseWorkspaceInvitationsResponse>(
      `/api/workspace/${encodeURIComponent(workspaceSlug)}/invitations`
    );

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
