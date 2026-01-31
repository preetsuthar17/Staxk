import useSWR from "swr";
import type { InvitationWithWorkspace } from "@/lib/invitation";

interface UseUserInvitationsResponse {
  invitations: InvitationWithWorkspace[];
}

export function useUserInvitations() {
  const { data, error, isLoading, mutate } = useSWR<UseUserInvitationsResponse>(
    "/api/user/invitations"
  );

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
