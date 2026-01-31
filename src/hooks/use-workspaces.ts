import useSWR from "swr";
import type { WorkspaceData } from "@/lib/workspace";

interface UseWorkspacesResponse {
  workspaces: WorkspaceData[];
}

interface UseWorkspacesOptions {
  initialData?: WorkspaceData[];
}

export function useWorkspaces(options?: UseWorkspacesOptions) {
  const { data, error, isLoading, mutate } = useSWR<UseWorkspacesResponse>(
    "/api/workspace/list",
    {
      fallbackData: options?.initialData
        ? { workspaces: options.initialData }
        : undefined,
    }
  );

  return {
    workspaces: data?.workspaces ?? [],
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}
