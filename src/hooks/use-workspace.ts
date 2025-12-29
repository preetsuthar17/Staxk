"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getWorkspaceSlug } from "@/components/dashboard/sidebar/utils";
import { safeClientError } from "@/lib/client-logger";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  role: string;
}

const WORKSPACE_STORAGE_KEY = "currentWorkspaceId";

export function useWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  const workspaceSlug = getWorkspaceSlug(pathname);

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceSlug) {
        setCurrentWorkspace(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/workspace/by-slug?slug=${encodeURIComponent(workspaceSlug)}`
        );
        const data = await response.json();

        if (response.ok && data.workspace) {
          setCurrentWorkspace(data.workspace);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, data.workspace.id);
        } else {
          setCurrentWorkspace(null);
          localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        }
      } catch (error) {
        safeClientError("Error loading workspace:", error);
        setCurrentWorkspace(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceSlug]);

  const switchWorkspace = useCallback(
    (slug: string) => {
      router.push(`/${slug}`);
    },
    [router]
  );

  const logoutWorkspace = useCallback(() => {
    localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    router.push("/");
  }, [router]);

  return {
    currentWorkspace,
    workspaceSlug,
    isLoading,
    switchWorkspace,
    logoutWorkspace,
  };
}
