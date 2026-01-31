import useSWR from "swr";
import type { TeamData } from "@/lib/team";

interface UseTeamsResponse {
  teams: TeamData[];
}

interface UseTeamsOptions {
  initialData?: TeamData[];
}

export function useTeams(workspaceSlug: string, options?: UseTeamsOptions) {
  const { data, error, isLoading, mutate } = useSWR<UseTeamsResponse>(
    `/api/team/list?workspaceSlug=${workspaceSlug}`,
    {
      fallbackData: options?.initialData
        ? { teams: options.initialData }
        : undefined,
    }
  );

  return {
    teams: data?.teams ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
